"use client"

import { Bell, Moon, Sun, User } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [isDark, setIsDark] = useState(true)

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-yellow-400">$$$ Sanad</div>
        </div>

        {/* Right Navigation */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-neutral-900 rounded-lg transition-colors" aria-label="Notifications">
            <Bell size={20} className="text-gray-400" />
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-neutral-900 rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-400" />}
          </button>
          <button className="p-2 hover:bg-neutral-900 rounded-lg transition-colors" aria-label="User profile">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
              <User size={18} className="text-black" />
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
