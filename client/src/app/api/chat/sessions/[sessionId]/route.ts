import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "http://localhost:3001";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const token = req.headers.get("Authorization");
  const { sessionId } = await params;

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/chat/sessions/${sessionId}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || "Failed to get chat session" },
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
    console.error("Error getting chat session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const token = req.headers.get("Authorization");
  const { sessionId } = await params;

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || "Failed to delete chat session" },
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
    console.error("Error deleting chat session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}