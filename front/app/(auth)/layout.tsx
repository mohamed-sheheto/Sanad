'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  GitCompare,
  User,
  LogOut
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gold', label: 'Gold', icon: TrendingUp },
  { href: '/stocks', label: 'Stocks', icon: TrendingUp },
  { href: '/real-estate', label: 'Real Estate', icon: Building2 },
  { href: '/comparison', label: 'Comparison', icon: GitCompare },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a1a] border-r border-[#1F2937] h-screen fixed left-0 top-0 pt-6 overflow-y-auto z-50 flex flex-col">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-bold text-[#F59E0B]">Sanad</h1>
        </div>

        <nav className="space-y-2 px-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-4 ${isActive
                  ? 'bg-[#F59E0B]/20 border-l-4 border-[#F59E0B] text-[#F59E0B]'
                  : 'text-[#6B7280] border-l-4 border-transparent hover:text-[#F3F4F6] hover:bg-[#2a2a2a]'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* زرار الـ Logout في أسفل السايد بار */}
        <div className="px-4 mb-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200 border-l-4 border-transparent"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>

        <div className="px-6 pb-6 text-xs text-[#6B7280]">
          © 2026 Sanad Investments
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}