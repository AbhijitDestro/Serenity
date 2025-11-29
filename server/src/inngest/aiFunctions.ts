import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

// Initialize Gemini
const genAI = new GoogleGenerativeAI( process.env.GEMINI_API_KEY! );

// -------------------------
// Helper: safely extract text from Gemini result
// -------------------------
async function extractTextFromGenResult(result: any, logger: any, label: string = ""): Promise<string> {
  try {
    if (!result) return "";

    // If result.response is a function → call it
    if (typeof result.response === "function") {
      const resp = await result.response();
      if (resp?.text) return (await resp.text()).trim();
      if (typeof resp === "string") return resp.trim();
      return JSON.stringify(resp).trim();
    }

    // If result.response is a promise-like
    if (result.response && typeof result.response.then === "function") {
      const resp = await result.response;
      if (resp?.text) return (await resp.text()).trim();
      if (typeof resp === "string") return resp.trim();
      return JSON.stringify(resp).trim();
    }

    // If result.response is a simple object with .text()
    if (result.response && typeof result.response.text === "function") {
      return (await result.response.text()).trim();
    }

    // If SDK returns output array
    if (Array.isArray(result.output)) {
      const collected = result.output
        .map((o: any) => {
          if (!o) return "";
          if (o.content) {
            return o.content.map((c: any) => c?.text ?? "").join(" ");
          }
          return o.text ?? "";
        })
        .join("\n")
        .trim();

      if (collected) return collected;
    }

    return JSON.stringify(result).trim();
  } catch (err) {
    logger.error("Error extracting text from gen result", { err, label, result });
    return "";
  }
}

// -----------------------------------------------------------
// MAIN FUNCTION
// -----------------------------------------------------------

export const processChatMessage = inngest.createFunction(
  {
    id: "process-chat-message",
  },
  { event: "therapy/session.message" },
  async ({ event, step }) => {
    try {
      const {
        message,
        history,
        memory = {
          userProfile: {
            emotionalState: [],
            riskLevel: 0,
            preferences: {},
          },
          sessionContext: {
            conversationThemes: [],
            currentTechnique: null,
          },
        },
        goals = [],
        systemPrompt,
      } = event.data;

      logger.info("Processing chat message:", {
        message,
        historyLength: history?.length,
      });

      // -----------------------------------------------------------
      // STEP 1: ANALYSIS USING GEMINI
      // -----------------------------------------------------------
      const analysis = await step.run("analyze-message", async () => {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const prompt = `Analyze this therapy message and provide insights. Return ONLY a valid JSON object with no markdown formatting.
Message: ${message}
Context: ${JSON.stringify({ memory, goals })}

Required JSON:
{
  "emotionalState": "string",
  "themes": ["string"],
  "riskLevel": number,
  "recommendedApproach": "string",
  "progressIndicators": ["string"]
}`;

          const result = await model.generateContent(prompt);
          const rawText = await extractTextFromGenResult(result, logger, "analysis");

          logger.info("Raw analysis text:", { rawText });

          // Extract JSON block if extra text exists
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? jsonMatch[0] : rawText;

          const cleanText = jsonText.trim();
          const parsed = JSON.parse(cleanText);

          return parsed;
        } catch (error) {
          logger.error("Error in message analysis:", { error, message });
          return {
            emotionalState: "neutral",
            themes: [],
            riskLevel: 0,
            recommendedApproach: "supportive",
            progressIndicators: [],
          };
        }
      });

      // -----------------------------------------------------------
      // STEP 2: UPDATE MEMORY
      // -----------------------------------------------------------
      const updatedMemory = await step.run("update-memory", async () => {
        if (analysis.emotionalState) {
          memory.userProfile.emotionalState.push(analysis.emotionalState);
        }
        if (analysis.themes) {
          memory.sessionContext.conversationThemes.push(...analysis.themes);
        }
        if (analysis.riskLevel !== undefined) {
          memory.userProfile.riskLevel = analysis.riskLevel;
        }
        return memory;
      });

      // -----------------------------------------------------------
      // STEP 3: SAFETY ALERT
      // -----------------------------------------------------------
      if (analysis.riskLevel > 4) {
        await step.run("trigger-risk-alert", async () => {
          logger.warn("High risk level detected", {
            message,
            riskLevel: analysis.riskLevel,
          });
        });
      }

      // -----------------------------------------------------------
      // STEP 4: GENERATE THERAPEUTIC RESPONSE
      // -----------------------------------------------------------
      const response = await step.run("generate-response", async () => {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const prompt = `${systemPrompt || ""}

Based on the following context, generate a therapeutic response:
Message: ${message}
Analysis: ${JSON.stringify(analysis)}
Memory: ${JSON.stringify(updatedMemory)}
Goals: ${JSON.stringify(goals)}

Response requirements:
1. Be empathetic and supportive
2. Address emotional needs
3. Use therapeutic techniques
4. Stay professional
5. Ensure safety and grounding`;

          const result = await model.generateContent(prompt);
          const responseText = await extractTextFromGenResult(result, logger, "generate-response");

          logger.info("Generated response:", { responseText });

          if (!responseText) throw new Error("Empty response");

          return responseText;
        } catch (error) {
          logger.error("Error generating response:", { error, message });
          return "I'm here to support you. Could you tell me more about what's on your mind?";
        }
      });

      // -----------------------------------------------------------
      // FINAL RETURN
      // -----------------------------------------------------------
      return {
        response,
        analysis,
        updatedMemory,
      };
    } catch (error) {
      logger.error("Error in overall processing:", {
        error,
        message: event.data.message,
      });

      return {
        response:
          "I'm here to support you. Could you tell me more about what's on your mind?",
        analysis: {
          emotionalState: "neutral",
          themes: [],
          riskLevel: 0,
          recommendedApproach: "supportive",
          progressIndicators: [],
        },
        updatedMemory: event.data.memory,
      };
    }
  }
);

// Function to analyze therapy session content
export const analyzeTherapySession = inngest.createFunction(
  { id: "analyze-therapy-session" },
  { event: "therapy/session.created" },
  async ({ event, step }) => {
    try {
      // Get the session content
      const sessionContent = await step.run("get-session-content", async () => {
        return event.data.notes || event.data.transcript;
      });

      // Analyze the session using Gemini
      const analysis = await step.run("analyze-with-gemini", async () => {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `Analyze this therapy session and provide insights:
        Session Content: ${sessionContent}
        
        Please provide:
        1. Key themes and topics discussed
        2. Emotional state analysis
        3. Potential areas of concern
        4. Recommendations for follow-up
        5. Progress indicators
        
        Format the response as a JSON object.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return JSON.parse(text);
      });

      // Store the analysis
      await step.run("store-analysis", async () => {
        // Here you would typically store the analysis in your database
        logger.info("Session analysis stored successfully");
        return analysis;
      });

      // If there are concerning indicators, trigger an alert
      if (analysis.areasOfConcern?.length > 0) {
        await step.run("trigger-concern-alert", async () => {
          logger.warn("Concerning indicators detected in session analysis", {
            sessionId: event.data.sessionId,
            concerns: analysis.areasOfConcern,
          });
          // Add your alert logic here
        });
      }

      return {
        message: "Session analysis completed",
        analysis,
      };
    } catch (error) {
      logger.error("Error in therapy session analysis:", error);
      throw error;
    }
  }
);


// Function to generate personalized activity recommendations
export const generateActivityRecommendations = inngest.createFunction(
  { id: "generate-activity-recommendations" },
  { event: "mood/updated" },
  async ({ event, step }) => {
    try {
      // Get user's mood history and activity history
      const userContext = await step.run("get-user-context", async () => {
        // Here you would typically fetch user's history from your database
        return {
          recentMoods: event.data.recentMoods,
          completedActivities: event.data.completedActivities,
          preferences: event.data.preferences,
        };
      });

      // Generate recommendations using Gemini
      const recommendations = await step.run(
        "generate-recommendations",
        async () => {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          const prompt = `Based on the following user context, generate personalized activity recommendations:
        User Context: ${JSON.stringify(userContext)}
        
        Please provide:
        1. 3-5 personalized activity recommendations
        2. Reasoning for each recommendation
        3. Expected benefits
        4. Difficulty level
        5. Estimated duration
        
        Format the response as a JSON object.`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          return JSON.parse(text);
        }
      );

      // Store the recommendations
      await step.run("store-recommendations", async () => {
        // Here you would typically store the recommendations in your database
        logger.info("Activity recommendations stored successfully");
        return recommendations;
      });

      return {
        message: "Activity recommendations generated",
        recommendations,
      };
    } catch (error) {
      logger.error("Error generating activity recommendations:", error);
      throw error;
    }
  }
);

// Add the functions to the exported array
export const functions = [
  processChatMessage,
  analyzeTherapySession,
  generateActivityRecommendations,
];