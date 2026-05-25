import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "appier.com";

const isConfigured = !!(
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: isConfigured
    ? [
        Google({
          authorization: {
            params: {
              scope:
                "openid email profile https://www.googleapis.com/auth/drive.file",
            },
          },
        }),
      ]
    : [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn({ user }) {
      if (!isConfigured) return true;
      return user.email?.endsWith(`@${ALLOWED_DOMAIN}`) ?? false;
    },
    jwt({ token, account }) {
      if (account?.access_token) {
        token.access_token = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      session.access_token = token.access_token as string | undefined;
      return session;
    },
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
