'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Home,
  Building2,
  GitCompare,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gold', label: 'Gold', icon: TrendingUp },
  { href: '/stocks', label: 'Stocks', icon: TrendingUp },
  { href: '/real-estate', label: 'Real Estate', icon: Building2 },
  { href: '/comparison', label: 'Comparison', icon: GitCompare },
  { href: '/profile', label: 'Profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1a1a1a] border-r border-[#1F2937] h-screen fixed left-0 top-0 pt-6 overflow-y-auto">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold text-[#F59E0B]">Sanad</h1>
      </div>

      <nav className="space-y-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border-l-4 ${
                isActive
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

      <div className="absolute bottom-6 left-6 right-6 text-xs text-[#6B7280]">
        © 2025 Sanad Investments
      </div>
    </aside>
  )
}
