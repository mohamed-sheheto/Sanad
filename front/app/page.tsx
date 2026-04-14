"use client";

import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const chartData = [
  { month: "Jan", value: 0 },
  { month: "Feb", value: 2 },
  { month: "Mar", value: 1.5 },
  { month: "Apr", value: 4 },
  { month: "May", value: 3.5 },
  { month: "Jun", value: 15 },
];

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    const history = localStorage.getItem("login_history");

    if (history) {
      setSavedEmails(JSON.parse(history));
    }

    if (isLoggedIn && token) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, router]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        const token = data.access_token || data.token;
        localStorage.setItem("jwt", token);

        const updatedHistory = Array.from(new Set([...savedEmails, email]));
        localStorage.setItem("login_history", JSON.stringify(updatedHistory));

        login(data.user, token);
        window.location.replace("/dashboard");
      } else {
        setError(data.detail || "Email or password incorrect");
      }
    } catch (err) {
      setError("Connection error with the server");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#F59E0B]">Sanad</h1>
          {/* <p className="text-[#6B7280] mt-2">
            Your AI-Powered Investment Guide
          </p> */}
        </div>

        {/* Hero Image */}
        <div className="rounded-lg mb-8 border border-[#1F2937] h-48 overflow-hidden">
          <img
            src="/images/hero-sanad-cover.png"
            alt="Investment themes"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-3">
            Welcome to Sanad
          </h2>
          {error && (
            <p className="text-red-500 text-sm mb-2 font-bold">{error}</p>
          )}
          <p className="text-[#6B7280] mb-6">
            Your AI-Powered Investment Guide
          </p>
        </div>

        {/* Saved Accounts */}
        {savedEmails.length > 0 && (
          <div className="mb-6 bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-4">
            <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wider font-bold">
              Saved Accounts
            </p>
            <div className="space-y-2">
              {savedEmails.map((savedEmail) => (
                <button
                  key={savedEmail}
                  type="button"
                  onClick={() => setEmail(savedEmail)}
                  className="w-full text-left p-2 text-sm text-[#F3F4F6] hover:bg-[#F59E0B]/10 rounded border border-transparent hover:border-[#F59E0B] transition flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                  {savedEmail}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Login Form
        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#F3F4F6] mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#1F2937] rounded-lg text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#F3F4F6] mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#1F2937] rounded-lg text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] transition"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111827] font-bold py-3 rounded-lg transition duration-200"
          >
            Login
          </button>
        </form> */}

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111827] font-bold py-3 rounded-lg transition duration-200 mb-6 flex items-center justify-center gap-2"
        >
          Continue with Google
        </button>

        {/* <button
          onClick={() => handleLogin()}
          className="w-full bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111827] font-bold py-3 rounded-lg transition duration-200 mb-8"
        >
          Get Started
        </button> */}

        {/* Portfolio Growth Simulation */}
        <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
          <h3 className="text-sm font-bold text-[#F3F4F6] mb-4 text-center">
            Portfolio Growth
          </h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
