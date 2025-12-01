import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "https://serenity-backend-cdu2.onrender.com";

// Validate that BACKEND_API_URL is set
if (!process.env.BACKEND_API_URL) {
  console.warn("BACKEND_API_URL not set, using default: http://localhost:3001");
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const response = await fetch(`${API_URL}/api/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(body),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json(
          { error: error.message || "Failed to log activity" },
          { status: response.status },
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // If not JSON, it's likely an error page
      const text = await response.text();
      console.error(
        "Non-JSON response from backend:",
        text.substring(0, 200) + (text.length > 200 ? "..." : ""),
      );
      return NextResponse.json(
        {
          error: "Backend service unavailable",
          message: "Invalid response format",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}