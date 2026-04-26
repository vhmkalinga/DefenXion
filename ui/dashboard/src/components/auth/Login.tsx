import { useState } from "react";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import axios from "axios";

interface LoginProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

export function Login({
  onLogin,
  onSwitchToSignup,
  onForgotPassword,
}: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      // Store tokens
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      setIsLoading(false);
      onLogin();

    } catch (err: any) {
      setIsLoading(false);

      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else if (err.response?.status === 403) {
        setError("Account is temporarily locked");
      } else if (err.response?.status === 429) {
        setError("Too many login attempts. Try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1F6FEB]/10 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-[#1F6FEB]" />
          </div>
          <h1 className="text-[#E6EDF3] mb-2 text-xl font-semibold">
            Welcome Back
          </h1>
          <p className="text-[#7D8590]">Sign in to DefenXion</p>
        </div>

        <div className="bg-[#161B22] rounded-2xl p-8 border border-[#30363D]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#C9D1D9]">
                Username
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#C9D1D9]">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D8590]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D8590] hover:text-[#C9D1D9]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm text-[#C9D1D9] cursor-pointer"
                >
                  Remember me
                </label>
              </div>

              <Button
                type="button"
                variant="link"
                onClick={onForgotPassword}
                className="text-[#58A6FF] hover:text-[#1F6FEB] p-0 h-auto"
              >
                Forgot password?
              </Button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-[#1F6FEB] hover:bg-[#1F6FEB]/90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 text-center">
            <span className="text-[#7D8590] text-sm">
              Don't have an account?{" "}
            </span>
            <Button
              type="button"
              variant="link"
              onClick={onSwitchToSignup}
              className="text-[#58A6FF] hover:text-[#1F6FEB] p-0 h-auto text-sm"
            >
              Sign up
            </Button>
          </div>
        </div>

        <p className="text-center text-[#7D8590] text-xs mt-6">
          DefenXion © 2026 — Intelligent Defense System
        </p>
      </div>
    </div>
  );
}
