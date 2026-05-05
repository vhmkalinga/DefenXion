import { useState, useEffect, useRef } from "react";
import { Shield, Lock, Eye, EyeOff, User, AlertCircle, Loader2, Wifi, WifiOff, KeyRound } from "lucide-react";
import axios from "axios";
import { login2FA } from "../../services/api";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "../ui/input-otp";

interface LoginProps {
  onLogin: () => void;
}

/* ─────────────────────────────────────────────
   Animated canvas particle network background
───────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    const PARTICLE_COUNT = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      radius: number; opacity: number;
    }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.4,
      opacity: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(31,111,235,${0.12 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(88,166,255,${p.opacity})`;
        ctx.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse at 30% 20%, #0d1a2e 0%, #0D1117 55%, #060a0f 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Threat ticker (purely decorative)
───────────────────────────────────────────── */
const TICKER_ITEMS = [
  "IDS ACTIVE · ML MODEL LOADED",
  "REAL-TIME THREAT MONITORING",
  "DEFENCE ENGINE OPERATIONAL",
  "CICIDS2017 · 98.2% ACCURACY",
  "AUTO-RESPONSE: ENABLED",
  "WEBSOCKET STREAM: CONNECTED",
];

function ThreatTicker() {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % TICKER_ITEMS.length);
        setFade(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 10, letterSpacing: "0.12em",
      color: fade ? "rgba(63,185,80,0.75)" : "transparent",
      transition: "color 0.3s ease",
      fontFamily: "'Courier New', monospace",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: "#3FB950",
        boxShadow: "0 0 8px rgba(63,185,80,0.6)",
        animation: "blink 2s ease-in-out infinite",
        flexShrink: 0,
      }} />
      {TICKER_ITEMS[idx]}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Login Component
───────────────────────────────────────────── */
export function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<"username" | "password" | null>(null);
  const [shake, setShake] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [tempToken, setTempToken] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Check backend connectivity once
  useEffect(() => {
    axios.get("http://localhost:8000/", { timeout: 3000 })
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post(
        "http://localhost:8000/auth/login",
        formData,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data.two_factor_required) {
        setTempToken(response.data.temp_token);
        setStep("2fa");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      setIsLoading(false);
      onLogin();
    } catch (err: any) {
      setIsLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);

      if (err.response?.status === 401) {
        setError("Invalid username or password.");
      } else if (err.response?.status === 403) {
        setError("Account is temporarily locked.");
      } else if (err.response?.status === 429) {
        setError("Too many attempts — please wait before trying again.");
      } else {
        setError("Cannot reach the server. Make sure the backend is running.");
      }
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await login2FA(tempToken, otpCode);
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      setIsLoading(false);
      onLogin();
    } catch (err: any) {
      setIsLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setError("Invalid 2FA code.");
    }
  };

  const fieldStyle = (field: "username" | "password"): React.CSSProperties => ({
    width: "100%",
    background: "rgba(13,17,23,0.8)",
    border: `1px solid ${focusedField === field ? "rgba(31,111,235,0.7)" : "rgba(48,54,61,0.8)"}`,
    borderRadius: 10,
    padding: "12px 40px",
    color: "#E6EDF3",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxShadow: focusedField === field
      ? "0 0 0 3px rgba(31,111,235,0.15), inset 0 1px 3px rgba(0,0,0,0.3)"
      : "inset 0 1px 3px rgba(0,0,0,0.3)",
  });

  return (
    <>
      <ParticleCanvas />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes scanline {
          0%{top:-10%} 100%{top:110%}
        }
        @keyframes glowPulse {
          0%,100%{box-shadow:0 0 30px rgba(31,111,235,0.2),0 32px 64px rgba(0,0,0,0.5)}
          50%{box-shadow:0 0 50px rgba(31,111,235,0.35),0 32px 64px rgba(0,0,0,0.5)}
        }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #0D1117 inset !important;
          -webkit-text-fill-color: #E6EDF3 !important;
        }
        input::placeholder { color: rgba(125,133,144,0.6); }
      `}</style>

      {/* Page layout */}
      <div style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* ── Left panel (branding) ── */}
        <div style={{
          display: "none",
          flex: 1,
          padding: "60px 64px",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid rgba(48,54,61,0.35)",
        }} className="login-left-panel">
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #1F6FEB, #58A6FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(31,111,235,0.4)",
            }}>
              <Shield size={20} color="white" />
            </div>
            <span style={{ color: "#E6EDF3", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
              Defen<span style={{ color: "#58A6FF" }}>Xion</span>
            </span>
          </div>

          {/* Hero stats */}
          <div>
            <h1 style={{ color: "#E6EDF3", fontSize: 40, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
              Intelligent<br />
              <span style={{ background: "linear-gradient(90deg,#1F6FEB,#58A6FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Network Defence
              </span>
            </h1>
            <p style={{ color: "#7D8590", fontSize: 15, lineHeight: 1.7, maxWidth: 360 }}>
              Machine-learning powered intrusion detection with real-time automated threat response.
            </p>

            <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
              {[
                { value: "98.2%", label: "Accuracy" },
                { value: "12ms", label: "Inference" },
                { value: "2.4M", label: "Trained on" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ color: "#58A6FF", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{stat.value}</div>
                  <div style={{ color: "#7D8590", fontSize: 12, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <ThreatTicker />
        </div>

        {/* ── Right panel (form) ── */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          minHeight: "100vh",
        }}>
          <div style={{
            width: "100%",
            maxWidth: 420,
            animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
          }}>

            {/* Card */}
            <div
              style={{
                background: "rgba(22,27,34,0.85)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(48,54,61,0.6)",
                borderRadius: 20,
                padding: "40px 36px",
                position: "relative",
                overflow: "hidden",
                animation: "glowPulse 4s ease-in-out infinite",
              }}
            >
              {/* Scanline accent */}
              <div style={{
                position: "absolute", left: 0, right: 0, height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(31,111,235,0.3), transparent)",
                animation: "scanline 5s linear infinite",
                pointerEvents: "none",
              }} />

              {/* Top gradient accent line */}
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                background: "linear-gradient(90deg, transparent, rgba(88,166,255,0.6), transparent)",
              }} />

              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 64, height: 64, borderRadius: 18,
                  background: "linear-gradient(135deg, rgba(31,111,235,0.15), rgba(88,166,255,0.08))",
                  border: "1px solid rgba(31,111,235,0.25)",
                  marginBottom: 16,
                  boxShadow: "0 8px 24px rgba(31,111,235,0.2)",
                }}>
                  <Shield size={28} color="#1F6FEB" />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ color: "#E6EDF3", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    Defen<span style={{ color: "#58A6FF" }}>Xion</span>
                  </span>
                </div>
                <p style={{ color: "#7D8590", fontSize: 13, marginBottom: 4 }}>
                  Sign in to your security dashboard
                </p>

                {/* Backend status pill */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  marginTop: 10, padding: "3px 10px", borderRadius: 20,
                  background: backendOnline === false
                    ? "rgba(255,77,77,0.08)"
                    : backendOnline === true
                    ? "rgba(63,185,80,0.08)"
                    : "rgba(125,133,144,0.08)",
                  border: `1px solid ${backendOnline === false ? "rgba(255,77,77,0.2)" : backendOnline === true ? "rgba(63,185,80,0.2)" : "rgba(125,133,144,0.2)"}`,
                }}>
                  {backendOnline === false
                    ? <><WifiOff size={10} color="#FF4D4D" /><span style={{ fontSize: 10, color: "#FF4D4D" }}>Backend Offline</span></>
                    : backendOnline === true
                    ? <><Wifi size={10} color="#3FB950" /><span style={{ fontSize: 10, color: "#3FB950" }}>Backend Online</span></>
                    : <><span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #7D8590", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.8s linear infinite" }} /><span style={{ fontSize: 10, color: "#7D8590" }}>Checking…</span></>
                  }
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                {/* Error Banner */}
                {error && (
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 9,
                    background: "rgba(255,77,77,0.08)",
                    border: "1px solid rgba(255,77,77,0.2)",
                    borderRadius: 10, padding: "10px 12px",
                    animation: shake ? "shake 0.5s ease" : "fadeUp 0.3s ease",
                  }}>
                    <AlertCircle size={15} color="#FF4D4D" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: "#FF4D4D", fontSize: 13 }}>{error}</span>
                  </div>
                )}

                {step === "credentials" ? (
                  <>
                    {/* Username */}
                    <div>
                      <label style={{ display: "block", color: "#C9D1D9", fontSize: 13, fontWeight: 500, marginBottom: 7 }}>
                        Username
                      </label>
                      <div style={{ position: "relative" }}>
                        <User
                          size={15}
                          color={focusedField === "username" ? "#58A6FF" : "#7D8590"}
                          style={{
                            position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                            transition: "color 0.2s",
                          }}
                        />
                        <input
                          id="username"
                          type="text"
                          placeholder="Enter username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setFocusedField("username")}
                          onBlur={() => setFocusedField(null)}
                          style={fieldStyle("username")}
                          required
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label style={{ display: "block", color: "#C9D1D9", fontSize: 13, fontWeight: 500, marginBottom: 7 }}>
                        Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <Lock
                          size={15}
                          color={focusedField === "password" ? "#58A6FF" : "#7D8590"}
                          style={{
                            position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                            transition: "color 0.2s",
                          }}
                        />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          style={{ ...fieldStyle("password"), paddingRight: 44 }}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer",
                            color: "#7D8590", display: "flex", alignItems: "center",
                            padding: 4,
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#C9D1D9")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#7D8590")}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Remember + Forgot */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          style={{
                            width: 15, height: 15, accentColor: "#1F6FEB",
                            borderRadius: 4, cursor: "pointer",
                          }}
                        />
                        <span style={{ color: "#7D8590", fontSize: 13 }}>Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => alert("Contact your system administrator to reset your password.")}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "#58A6FF", fontSize: 13, fontFamily: "inherit",
                          padding: 0,
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#1F6FEB")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#58A6FF")}
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading || !username || !password}
                      style={{
                        width: "100%",
                        padding: "13px",
                        borderRadius: 10,
                        border: "none",
                        cursor: isLoading || !username || !password ? "not-allowed" : "pointer",
                        background: isLoading || !username || !password
                          ? "rgba(31,111,235,0.35)"
                          : "linear-gradient(135deg, #1F6FEB 0%, #2679f5 50%, #58A6FF 100%)",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        letterSpacing: "0.01em",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "all 0.2s ease",
                        boxShadow: !isLoading && username && password
                          ? "0 4px 20px rgba(31,111,235,0.4)"
                          : "none",
                        marginTop: 4,
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && username && password) {
                          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(31,111,235,0.55)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = username && password ? "0 4px 20px rgba(31,111,235,0.4)" : "none";
                      }}
                    >
                      {isLoading
                        ? <><Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Authenticating…</>
                        : "Sign In →"
                      }
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                      <div style={{ color: "#E6EDF3", fontSize: 15, fontWeight: 500 }}>Two-Factor Authentication</div>
                      <p style={{ color: "#7D8590", fontSize: 13, textAlign: "center", marginBottom: 8 }}>
                        Enter the 6-digit code from your authenticator app.
                      </p>
                      
                      <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} style={{ width: 45, height: 50, fontSize: 18 }} />
                          <InputOTPSlot index={1} style={{ width: 45, height: 50, fontSize: 18 }} />
                          <InputOTPSlot index={2} style={{ width: 45, height: 50, fontSize: 18 }} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} style={{ width: 45, height: 50, fontSize: 18 }} />
                          <InputOTPSlot index={4} style={{ width: 45, height: 50, fontSize: 18 }} />
                          <InputOTPSlot index={5} style={{ width: 45, height: 50, fontSize: 18 }} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <button
                        type="button"
                        onClick={() => { setStep("credentials"); setOtpCode(""); setTempToken(""); setError(""); }}
                        style={{
                          flex: 1, padding: "13px", borderRadius: 10, border: "1px solid rgba(48,54,61,0.8)",
                          background: "transparent", color: "#E6EDF3", fontSize: 14, fontWeight: 600,
                          cursor: "pointer", transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handle2FASubmit}
                        disabled={isLoading || otpCode.length !== 6}
                        style={{
                          flex: 1, padding: "13px", borderRadius: 10, border: "none",
                          cursor: isLoading || otpCode.length !== 6 ? "not-allowed" : "pointer",
                          background: isLoading || otpCode.length !== 6
                            ? "rgba(31,111,235,0.35)"
                            : "linear-gradient(135deg, #1F6FEB 0%, #2679f5 50%, #58A6FF 100%)",
                          color: "white", fontSize: 14, fontWeight: 600,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          transition: "all 0.2s ease"
                        }}
                      >
                        {isLoading ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <KeyRound size={16} />}
                        Verify
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* Footer */}
            <p style={{ textAlign: "center", color: "rgba(125,133,144,0.5)", fontSize: 11, marginTop: 20, letterSpacing: "0.04em" }}>
              DefenXion © 2026 — Intelligent Network Defence System
            </p>
          </div>
        </div>
      </div>

      {/* Responsive: show left panel on wide screens */}
      <style>{`
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </>
  );
}
