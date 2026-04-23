"use client";

import { useState, useEffect } from "react";

type UserProfile = {
  name: string;
  email: string;
  avatarInitial: string;
  joinedDate: string;
};

type PortfolioSnapshot = {
  totalValue: number;
  totalValueChange: number;
  topAsset: string;
  topAssetValue: number;
  topAssetPercentage: number;
};

export default function ProfilePage() {
  // ────────────────────────────────────────────────
  // البيانات الديناميكية
  const [user, setUser] = useState<UserProfile>({
    name: "User",
    email: "user@example.com",
    avatarInitial: "U",
    joinedDate: "January 15, 2025",
  });

  const [portfolio, setPortfolio] = useState<PortfolioSnapshot>({
    totalValue: 125450,
    totalValueChange: 12.5,
    topAsset: "Real Estate",
    topAssetValue: 45200,
    topAssetPercentage: 36,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ────────────────────────────────────────────────
  // جاهز للربط بالباك إند والـ AI
  useEffect(() => {
    /*
    async function fetchProfileData() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/user/profile')   // ← غير الرابط لاحقاً

        if (!res.ok) throw new Error('Failed to load profile')

        const data = await res.json()

        // تحديث بيانات المستخدم
        setUser({
          name: data.user?.name || user.name,
          email: data.user?.email || user.email,
          avatarInitial: data.user?.name?.[0]?.toUpperCase() || "U",
          joinedDate: data.user?.joinedDate || user.joinedDate
        })

        // تحديث بيانات المحفظة
        if (data.portfolio) {
          setPortfolio(data.portfolio)
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء تحميل البيانات')
        console.log('Using fallback profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()*/
  }, []);

  // ────────────────────────────────────────────────
  if (loading)
    return (
      <div className="text-center py-20 text-[#F3F4F6]">جاري التحميل...</div>
    );
  if (error)
    return <div className="text-center py-20 text-red-400">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#F3F4F6] mb-2">Profile</h1>
        <p className="text-[#6B7280]">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-8">
        {/* User Info */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-[#F59E0B] rounded-full flex items-center justify-center text-4xl font-bold text-[#111827]">
            {user.avatarInitial}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#F3F4F6]">{user.name}</h2>
            <p className="text-[#6B7280]">{user.email}</p>
          </div>
        </div>

        {/* Joined Date */}
        <div className="bg-[#0a0a0a] border border-[#1F2937] rounded-lg p-4 mb-6">
          <p className="text-[#6B7280] text-sm mb-2">Member Since</p>
          <p className="text-[#F3F4F6] font-medium">{user.joinedDate}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="bg-[#F59E0B] hover:bg-[#FBBF24] text-[#111827] font-bold py-3 px-6 rounded-lg transition">
            Edit Profile
          </button>
          <button className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#F3F4F6] font-bold py-3 px-6 rounded-lg transition border border-[#1F2937]">
            Change Password
          </button>
        </div>
      </div>

      {/* Portfolio Snapshot */}
      <div className="bg-[#1a1a1a] border border-[#1F2937] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">
          Portfolio Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0a0a0a] border border-[#1F2937] rounded-lg p-6">
            <p className="text-[#6B7280] text-sm mb-2">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-[#F3F4F6]">
              ${portfolio.totalValue.toLocaleString()}
            </p>
            <p
              className={`text-sm mt-2 ${portfolio.totalValueChange >= 0 ? "text-[#10B981]" : "text-red-400"}`}
            >
              {portfolio.totalValueChange >= 0 ? "+" : ""}
              {portfolio.totalValueChange}% from last month
            </p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#1F2937] rounded-lg p-6">
            <p className="text-[#6B7280] text-sm mb-2">Top Asset</p>
            <p className="text-3xl font-bold text-[#F3F4F6]">
              {portfolio.topAsset}
            </p>
            <p className="text-[#10B981] text-sm mt-2">
              ${portfolio.topAssetValue.toLocaleString()} (
              {portfolio.topAssetPercentage}% of portfolio)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
