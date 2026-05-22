import { signIn } from "@/auth";
import { C } from "@/lib/constants";

export default function LoginPage() {
  const configured = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: C.bgMain,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans JP','Inter','DM Sans',sans-serif",
      }}
    >
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "48px 40px",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.textMain,
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Appier <span style={{ color: C.brand }}>AI</span> Deal Room
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.textMuted,
            letterSpacing: "0.08em",
            marginBottom: 40,
          }}
        >
          REVENUE INTELLIGENCE HUB
        </div>

        {configured ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/deals" });
            }}
          >
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "13px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: C.textMain,
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                />
              </svg>
              Googleでログイン
            </button>
          </form>
        ) : (
          <div
            style={{
              background: C.warningLight,
              border: `1px solid ${C.warning}`,
              borderRadius: 10,
              padding: "16px 18px",
              fontSize: 12,
              color: "#92400E",
              lineHeight: 1.6,
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ OAuth未設定</div>
            <div>
              Google OAuth認証を有効にするには、<code>.env.local</code> に
              <code>AUTH_GOOGLE_ID</code> と <code>AUTH_GOOGLE_SECRET</code> を設定してください。
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 24 }}>
          Appier Enterprise Solutions © 2026
        </div>
      </div>
    </main>
  );
}
