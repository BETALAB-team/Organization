import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const received = String(body.password || "").trim();
  const expected = process.env.APP_PASSWORD?.trim();

  if (!expected) {
    return NextResponse.json(
      { error: "APP_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  if (received !== expected) {
    return NextResponse.json(
      {
        error: "Wrong password",
        receivedLength: received.length,
        expectedLength: expected.length,
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("app_access", "yes", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}