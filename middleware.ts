import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized: ({ req, token }) => {
            // If there is a token, user is authenticated
            return !!token;
        },
    },
});

export const config = {
    // Protect all routes except:
    // - api/auth (NextAuth routes)
    // - login (Login page)
    // - _next (Next.js internals)
    // - static files (images, etc)
    matcher: [
        "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
    ],
};
