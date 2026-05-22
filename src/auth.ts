import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const isConfigured = !!(
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: isConfigured ? [Google] : [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      if (!isConfigured) return true;
      const isLoggedIn = !!session?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/deals", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
});
