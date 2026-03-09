import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

export function proxy(request: NextRequest) {
  const url = request.nextUrl;

  // Proxy /api/* requests to the Python backend
  if (url.pathname.startsWith("/api/")) {
    const backendPath = url.pathname.replace(/^\/api/, "");
    const target = `${AGENT_URL}${backendPath}${url.search}`;
    return NextResponse.rewrite(new URL(target));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
