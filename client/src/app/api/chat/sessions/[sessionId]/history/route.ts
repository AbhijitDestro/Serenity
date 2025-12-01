import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.BACKEND_API_URL || "https://serenity-backend-cdu2.onrender.com";

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
    const response = await fetch(
      `${API_URL}/api/chat/sessions/${sessionId}/history`,
      {
        method: "GET",
        headers: {
          Authorization: token,
        },
      },
    );

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("Backend response for history:", { status: response.status, data });
      if (!response.ok) {
        return NextResponse.json(
          { message: data.message || "Failed to get chat history", error: data },
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
    console.error("Error getting chat history:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}