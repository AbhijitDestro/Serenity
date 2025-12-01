
import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "https://serenity-backend-cdu2.onrender.com";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/chat/sessions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || "Failed to fetch chat sessions" },
          { status: response.status },
        );
      }
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      console.error("Non-JSON response from backend:", text.substring(0, 200));
      return NextResponse.json(
        { message: "Backend service unavailable" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    // Note: We don't read req.json() here because createChatSession doesn't require a body
    // and reading an empty body causes an error.

    const response = await fetch(`${API_URL}/api/chat/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      // No body needed for creating a session
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || "Failed to create chat session" },
          { status: response.status },
        );
      }
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      console.error("Non-JSON response from backend:", text.substring(0, 200));
      return NextResponse.json(
        { message: "Backend service unavailable" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
