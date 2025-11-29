"use client";

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Loader2,
  MessageSquare,
  PlusCircle,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { BreathingActivity } from "@/components/games/breathing-game";
import { ForestActivity } from "@/components/games/forest-game";
import { OceanWaves } from "@/components/games/ocean-waves";
import { RainSounds } from "@/components/games/rain-sound";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  type ChatMessage,
  type ChatSession,
  createChatSession,
  deleteChatSession,
  getAllChatSessions,
  getChatHistory,
  sendChatMessage,
} from "@/lib/api/chat";
import { cn } from "@/lib/utils";

interface SuggestedQuestion {
  id: string;
  text: string;
}

interface StressPrompt {
  trigger: string;
  activity: {
    type: "breathing" | "forest" | "waves" | "rain";
    title: string;
    description: string;
  };
}

interface ApiResponse {
  message: string;
  metadata: {
    technique: string;
    goal: string;
    progress: any[];
  };
}

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: "1", text: "How can I manage my anxiety better?" },
  { id: "2", text: "I've been feeling overwhelmed lately" },
  { id: "3", text: "Can we talk about improving sleep?" },
  { id: "4", text: "I need help with work-life balance" },
];

const glowAnimation = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

const COMPLETION_THRESHOLD = 5;

export default function TherapyPage() {
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stressPrompt, setStressPrompt] = useState<StressPrompt | null>(null);
  const [showActivity, setShowActivity] = useState(false);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [showNFTCelebration, setShowNFTCelebration] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    params.sessionId as string,
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleDeleteSession = async (e: React.MouseEvent) => {
    e.preventDefault();
    const idToDelete = sessionToDelete;
    if (!idToDelete) return;

    try {
      // Optimistically update UI
      const updatedSessions = sessions.filter((s) => s.sessionId !== idToDelete);
      setSessions(updatedSessions);

      // If current session was deleted
      if (sessionId === idToDelete) {
        if (updatedSessions.length > 0) {
          // Navigate to the first available session
          const nextSession = updatedSessions[0];
          setSessionId(nextSession.sessionId);
          router.push(`/therapy/${nextSession.sessionId}`);
        } else {
          // No sessions left, create new one
          await handleNewSession();
        }
      }

      // Perform API call
      await deleteChatSession(idToDelete);
      
    } catch (error) {
      console.error("Failed to delete session:", error);
      // Revert state if API call fails
      const allSessions = await getAllChatSessions();
      setSessions(allSessions);
    } finally {
      setSessionToDelete(null);
    }
  };

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      const newSessionId = await createChatSession();
      console.log("New session created:", newSessionId);

      // Update sessions list immediately
      const newSession: ChatSession = {
        sessionId: newSessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update all state in one go
      setSessions((prev) => [newSession, ...prev]);
      setSessionId(newSessionId);
      setMessages([]);

      // Update URL without refresh
      window.history.pushState({}, "", `/therapy/${newSessionId}`);

      // Force a re-render of the chat area
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to create new session:", error);
      setIsLoading(false);
    }
  };

  // Initialize chat session and load history
  const creatingSessionRef = useRef(false);

  // Initialize chat session and load history
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        if (!sessionId || sessionId === "new") {
          // Prevent double creation
          if (creatingSessionRef.current) return;
          creatingSessionRef.current = true;

          console.log("Creating new chat session...");
          try {
            const newSessionId = await createChatSession();
            console.log("New session created:", newSessionId);
            setSessionId(newSessionId);
            window.history.pushState({}, "", `/therapy/${newSessionId}`);
          } catch (error) {
            console.error("Failed to create session:", error);
            creatingSessionRef.current = false; // Reset on failure
          }
        } else {
          // Reset ref when we have a valid session ID
          creatingSessionRef.current = false;
          
          console.log("Loading existing chat session:", sessionId);
          try {
            const history = await getChatHistory(sessionId);
            console.log("Loaded chat history:", history);
            if (Array.isArray(history)) {
              const formattedHistory = history.map((msg) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }));
              console.log("Formatted history:", formattedHistory);
              setMessages(formattedHistory);
            } else {
              console.error("History is not an array:", history);
              setMessages([]);
            }
          } catch (historyError) {
            console.error("Error loading chat history:", historyError);
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([
          {
            role: "assistant",
            content:
              "I apologize, but I'm having trouble loading the chat session. Please try refreshing the page.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [sessionId]);

  // Load all chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await getAllChatSessions();
        setSessions(allSessions);
      } catch (error) {
        console.error("Failed to load sessions:", error);
      }
    };

    loadSessions();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (!isTyping) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e?: React.FormEvent, customMessage?: string, sessionIdParam?: string) => {
    if (e) e.preventDefault();
    
    const messageToSend = customMessage || message.trim();
    const currentSessionId = sessionIdParam || sessionId;
    
    console.log("Form submitted");
    console.log("Message to send:", messageToSend);
    console.log("Session ID:", currentSessionId);
    console.log("Is typing:", isTyping);
    console.log("Is chat paused:", isChatPaused);

    if (!messageToSend || isTyping || isChatPaused || !currentSessionId) {
      console.log("Submission blocked:", {
        noMessage: !messageToSend,
        isTyping,
        isChatPaused,
        noSessionId: !currentSessionId,
      });
      return;
    }

    setMessage("");
    setIsTyping(true);

    try {
      // Add user message
      const userMessage: ChatMessage = {
        role: "user",
        content: messageToSend,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Check for stress signals
      const stressCheck = detectStressSignals(messageToSend);
      if (stressCheck) {
        setStressPrompt(stressCheck);
        setIsTyping(false);
        return;
      }

      console.log("Sending message to API...");
      // Send message to API using the current session ID
      const response = await sendChatMessage(currentSessionId, messageToSend);
      console.log("Raw API response:", response);

      // Parse the response if it's a string
      const aiResponse =
        typeof response === "string" ? JSON.parse(response) : response;
      console.log("Parsed AI response:", aiResponse);

      // Add the response to messages
      const newMessage: ChatMessage = {
        role: "assistant",
        content: aiResponse.message,
        timestamp: new Date(),
        metadata: {
          technique: aiResponse.metadata?.technique || undefined,
          goal: aiResponse.metadata?.goal || undefined,
          progress: aiResponse.metadata?.progress || undefined,
          analysis: aiResponse.metadata?.analysis || undefined,
        },
      };

      console.log("Created assistant message:", newMessage);

      // Add the message immediately
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const detectStressSignals = (message: string): StressPrompt | null => {
    const stressKeywords = [
      "stress",
      "anxiety",
      "worried",
      "panic",
      "overwhelmed",
      "nervous",
      "tense",
      "pressure",
      "can't cope",
      "exhausted",
    ];

    const lowercaseMsg = message.toLowerCase();
    const foundKeyword = stressKeywords.find((keyword) =>
      lowercaseMsg.includes(keyword),
    );

    if (foundKeyword) {
      const activities = [
        {
          type: "breathing" as const,
          title: "Breathing Exercise",
          description:
            "Follow calming breathing exercises with visual guidance",
        },

        {
          type: "forest" as const,
          title: "Mindful Forest",
          description: "Take a peaceful walk through a virtual forest",
        },
        {
          type: "waves" as const,
          title: "Ocean Waves",
          description: "Match your breath with gentle ocean waves",
        },
        {
          type: "rain" as const,
          title: "Rain Sounds",
          description: "Listen to the calming sound of rain",
        },
      ];

      return {
        trigger: foundKeyword,
        activity: activities[Math.floor(Math.random() * activities.length)],
      };
    }

    return null;
  };

  const handleSuggestedQuestion = async (text: string) => {
    try {
      console.log("Handling suggested question:", text);
      
      // If we're already typing or paused, don't do anything
      if (isTyping || isChatPaused) {
        console.log("Blocked: typing or paused");
        return;
      }

      let currentSessionId = sessionId;
      
      // If no session exists, create one first
      if (!currentSessionId || currentSessionId === "new") {
        console.log("Creating new session for suggested question...");
        const newSessionId = await createChatSession();
        setSessionId(newSessionId);
        currentSessionId = newSessionId;
        
        // Update URL
        window.history.pushState({}, "", `/therapy/${newSessionId}`);
        
        // Update sessions list
        const newSession: ChatSession = {
          sessionId: newSessionId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setSessions((prev) => [newSession, ...prev]);
      }
      
      // Directly call handleSubmit with the text and session ID
      // We pass the event as undefined
      await handleSubmit(undefined, text, currentSessionId);
    } catch (error) {
      console.error("Error handling suggested question:", error);
    }
  };

  const handleCompleteSession = async () => {
    if (isCompletingSession) return;
    setIsCompletingSession(true);
    try {
      setShowNFTCelebration(true);
    } catch (error) {
      console.error("Error completing session:", error);
    } finally {
      setIsCompletingSession(false);
    }
  };

  const handleSessionSelect = async (selectedSessionId: string) => {
    if (selectedSessionId === sessionId) return;

    try {
      setIsLoading(true);
      const history = await getChatHistory(selectedSessionId);
      if (Array.isArray(history)) {
        const formattedHistory = history.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedHistory);
        setSessionId(selectedSessionId);
        window.history.pushState({}, "", `/therapy/${selectedSessionId}`);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActivity = () => {
    if (!stressPrompt) return null;

    const handleComplete = () => {
      setShowActivity(false);
      setStressPrompt(null);
      setIsChatPaused(false);
      // Add a system message about completing the activity
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Great job completing the ${stressPrompt.activity.title}. How do you feel now?`,
          timestamp: new Date(),
        },
      ]);
    };

    switch (stressPrompt.activity.type) {
      case "breathing":
        return <BreathingActivity onComplete={handleComplete} />;
      case "forest":
        return <ForestActivity onComplete={handleComplete} />;
      case "waves":
      return <OceanWaves onComplete={handleComplete} />;
    case "rain":
      return <RainSounds onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 h-screen pt-26 pb-4">
      <div className="flex h-full gap-6">

        {/* Sidebar with chat history */}
        <div className="w-80 flex flex-col border bg-muted/30 rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Chat Sessions</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewSession}
                className="hover:bg-primary/10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <PlusCircle className="w-5 h-5" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleNewSession}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              New Session
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={cn(
                    "group relative p-3 rounded-lg text-sm cursor-pointer hover:bg-primary/5 transition-colors",
                    session.sessionId === sessionId
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10",
                  )}
                  onClick={() => handleSessionSelect(session.sessionId)}
                >
                  <div className="flex items-center gap-2 mb-1 pr-6">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="font-medium truncate">
                      {session.messages[0]?.content.slice(0, 30) || "New Chat"}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-muted-foreground pr-6">
                    {session.messages[session.messages.length - 1]?.content ||
                      "No messages yet"}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {session.messages.length} messages
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          const date = new Date(session.updatedAt);
                          if (isNaN(date.getTime())) {
                            return "Just now";
                          }
                          return formatDistanceToNow(date, {
                            addSuffix: true,
                          });
                        } catch (error) {
                          return "Just now";
                        }
                      })()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session.sessionId);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-background rounded-lg border">
          {/* Chat header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold">AI Therapist</h2>
                <p className="text-sm text-muted-foreground">
                  {messages.length} messages
                </p>
              </div>
            </div>
          </div>

          {messages.length === 0 ? (
            // Welcome screen with suggested questions
            <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative inline-flex flex-col items-center">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"
                      initial="initial"
                      animate="animate"
                      variants={glowAnimation}
                    />
                    <div className="relative flex items-center gap-2 text-2xl font-semibold">
                      <div className="relative">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <motion.div
                          className="absolute inset-0 text-primary"
                          initial="initial"
                          animate="animate"
                          variants={glowAnimation}
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                      </div>
                      <span className="bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                        AI Therapist
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2">
                      How can I assist you today?
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 relative">
                  <motion.div
                    className="absolute -inset-4 bg-gradient-to-b from-primary/5 to-transparent blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  />
                  {SUGGESTED_QUESTIONS.map((q, index) => (
                    <motion.div
                      key={q.text}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full h-auto py-4 px-6 text-left justify-start hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 relative z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("Suggested question clicked:", q.text);
                          handleSuggestedQuestion(q.text);
                        }}
                      >
                        {q.text}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="flex-1 overflow-y-auto scroll-smooth p-4">
              <div className="max-w-3xl mx-auto space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.timestamp.toISOString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex w-full",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "flex max-w-[80%] gap-3",
                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className="w-8 h-8 shrink-0 mt-1">
                          {msg.role === "assistant" ? (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                              <Bot className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className={cn(
                          "space-y-2 p-4 rounded-2xl shadow-sm",
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted/50 rounded-tl-none"
                        )}>
                          <div className="flex items-center justify-between gap-4">
                            <p className="font-medium text-xs opacity-70">
                              {msg.role === "assistant"
                                ? "AI Therapist"
                                : "You"}
                            </p>
                            {msg.metadata?.technique && (
                              <Badge variant="secondary" className="text-[10px] h-5">
                                {msg.metadata.technique}
                              </Badge>
                            )}
                          </div>
                          <div className={cn(
                            "prose prose-sm leading-relaxed",
                            msg.role === "user" ? "prose-invert" : "dark:prose-invert"
                          )}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.metadata?.goal && (
                            <p className="text-xs opacity-70 mt-2 border-t border-white/20 pt-2">
                              Goal: {msg.metadata.goal}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 py-8 flex gap-4 bg-muted/30"
                  >
                    <div className="w-8 h-8 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm">AI Therapist</p>
                      <p className="text-sm text-muted-foreground">Typing...</p>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50 p-4">
            <form
              onSubmit={(e) => handleSubmit(e)}
              className="max-w-3xl mx-auto flex gap-4 items-end relative"
            >
              <div className="flex-1 relative group">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    isChatPaused
                      ? "Complete the activity to continue..."
                      : "Ask me anything..."
                  }
                  className={cn(
                    "w-full resize-none rounded-2xl border bg-background",
                    "p-3 pr-12 min-h-[48px] max-h-[200px]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "transition-all duration-200",
                    "placeholder:text-muted-foreground/70",
                    (isTyping || isChatPaused) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                  rows={1}
                  disabled={isTyping || isChatPaused}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-1.5 bottom-3.5 h-[36px] w-[36px]",
                    "rounded-xl transition-all duration-200",
                    "bg-primary hover:bg-primary/90",
                    "shadow-sm shadow-primary/20",
                    (isTyping || isChatPaused || !message.trim()) &&
                      "opacity-50 cursor-not-allowed",
                    "group-hover:scale-105 group-focus-within:scale-105",
                  )}
                  disabled={isTyping || isChatPaused || !message.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="mt-2 text-xs text-center text-muted-foreground">
              Press <kbd className="px-2 py-0.5 rounded bg-muted">Enter ↵</kbd>{" "}
              to send,
              <kbd className="px-2 py-0.5 rounded bg-muted ml-1">
                Shift + Enter
              </kbd>{" "}
              for new line
            </div>
          </div>
        </div>
      </div>

      {/* Stress Activity Modal */}
      <AnimatePresence>
        {stressPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
            >
              {!showActivity ? (
                <div className="p-6 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold">
                      I noticed you're feeling {stressPrompt.trigger}
                    </h3>
                    <p className="text-muted-foreground">
                      Would you like to try a {stressPrompt.activity.title} to
                      help you feel better?
                    </p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setStressPrompt(null)}
                    >
                      No, thanks
                    </Button>
                    <Button
                      onClick={() => {
                        setShowActivity(true);
                        setIsChatPaused(true);
                      }}
                    >
                      Yes, let's try it
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative h-[600px] w-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-10"
                    onClick={() => {
                      setShowActivity(false);
                      setStressPrompt(null);
                      setIsChatPaused(false);
                    }}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  {renderActivity()}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your chat history for this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => handleDeleteSession(e)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}