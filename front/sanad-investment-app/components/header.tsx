'use client'

import { useAuth } from './auth-context'
import { Bell, Settings, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  TrendingUp,
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

export function Header() {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="bg-[#1a1a1a] border-b border-[#1F2937] h-16 fixed right-0 top-0 left-0 md:left-64 flex items-center justify-between px-6 z-40">
        {/* Mobile Menu Trigger */}
        <button className="md:hidden p-2 hover:bg-[#2a2a2a] rounded-lg transition">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Menu className="w-5 h-5 text-[#F59E0B]" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-[#1a1a1a] border-[#1F2937] p-0">
              <div className="px-6 mb-8 mt-6">
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
                      onClick={() => setOpen(false)}
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
            </SheetContent>
          </Sheet>
        </button>

        <div className="hidden md:flex items-center gap-4">
          <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition">
            <Bell className="w-5 h-5 text-[#F3F4F6]" />
          </button>
          <button className="p-2 hover:bg-[#2a2a2a] rounded-lg transition">
            <Settings className="w-5 h-5 text-[#F3F4F6]" />
          </button>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="w-10 h-10 bg-[#F59E0B] rounded-full flex items-center justify-center font-bold text-[#111827]">
            U
          </div>
          <button
            onClick={() => {
              logout()
              window.location.href = '/'
            }}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition flex items-center gap-2"
          >
            <LogOut className="w-5 h-5 text-[#F3F4F6]" />
            <span className="text-sm text-[#F3F4F6] hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
    </>
  )
}
