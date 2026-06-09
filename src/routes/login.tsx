import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Smartphone, Lock, Mail, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — PhoneTrack" },
      { name: "description", content: "Sign in to your PhoneTrack admin panel." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@phonetrack.com");
  const [password, setPassword] = useState("admin123");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("pt_auth") === "1") {
      navigate({ to: "/" });
    }
  }, [navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      if (email.trim() && password.length >= 4) {
        localStorage.setItem("pt_auth", "1");
        localStorage.setItem("pt_user", JSON.stringify({ email, name: email.split("@")[0] }));
        if (!remember) sessionStorage.setItem("pt_session", "1");
        navigate({ to: "/" });
      } else {
        setError("Enter a valid email and a password of at least 4 characters.");
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-10 flex-col justify-between">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative flex items-center gap-2.5">
          <div className="size-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Smartphone className="size-5" />
          </div>
          <div>
            <div className="font-semibold">PhoneTrack</div>
            <div className="text-xs opacity-80">IMEI Sales Module</div>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
            Track every phone.<br />Own every customer.
          </h1>
          <p className="mt-3 text-sm opacity-90 max-w-md">
            One dashboard to manage stock, sales, warranties, and customer history — by IMEI.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { k: "1.2k+", v: "Phones tracked" },
              { k: "98%", v: "Warranty coverage" },
              { k: "24/7", v: "Live insights" },
            ].map((s) => (
              <div key={s.v} className="bg-white/10 backdrop-blur rounded-lg p-3">
                <div className="text-xl font-bold">{s.k}</div>
                <div className="text-[10px] opacity-80">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs opacity-70">© 2026 PhoneTrack. All rights reserved.</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="size-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold">PhoneTrack</div>
              <div className="text-[10px] text-muted-foreground">IMEI Sales Module</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your phone sales.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">Password</label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-3.5 rounded border" />
              Remember me for 30 days
            </label>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">or</span></div>
            </div>

            <button type="button" className="w-full py-2.5 rounded-md border text-sm font-medium hover:bg-muted inline-flex items-center justify-center gap-2">
              <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Continue with Google
            </button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              Don't have an account? <a className="text-primary font-medium hover:underline" href="#">Contact admin</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
