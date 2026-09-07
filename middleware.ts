import { NextRequest, NextResponse } from "next/server";

const ADMIN_USER = "minella";
const ADMIN_PASS = "22@Oct@2002"; // ← change this

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Minella Admin"',
    },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
