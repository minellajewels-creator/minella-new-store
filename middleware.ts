import { NextRequest, NextResponse } from "next/server";

// Admin is served as a static HTML file at /public/admin/index.html
// Firebase Email Auth inside the HTML handles all authentication.
// No middleware auth needed here.
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
