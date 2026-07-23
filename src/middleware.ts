import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/clients/:path*",
        "/loans/:path*",
        "/reports/:path*",
        "/((?!api|login|forgot-password|reset-password|_next/static|_next/image|favicon.ico).*)",
    ]
};
