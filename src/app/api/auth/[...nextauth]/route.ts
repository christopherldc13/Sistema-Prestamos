import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const emailTrimmed = credentials.email.trim();
                const passwordTrimmed = credentials.password.trim();

                const user = await prisma.user.findUnique({
                    where: { email: emailTrimmed }
                });

                if (!user) return null;
                
                if (user.isActive === false) {
                    throw new Error("Su cuenta ha sido desactivada. Contacte al administrador.");
                }

                let isValid = false;
                try {
                    isValid = await compare(passwordTrimmed, user.password);
                } catch (e) {
                    // Fallback to plain text if bcrypt fails (e.g. during manual data transfers)
                }

                if (!isValid && user.password === passwordTrimmed) {
                    isValid = true;
                }

                if (isValid) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 20 * 60, // 20 minutes
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
