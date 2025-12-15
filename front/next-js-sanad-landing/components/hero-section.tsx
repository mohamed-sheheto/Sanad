"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function HeroSection() {
  const router = useRouter()

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center gap-8">
        {/* Hero Image */}
        <div className="w-full max-w-md bg-yellow-100 rounded-lg p-8 flex items-center justify-center min-h-64 overflow-hidden">
          <Image
            src="/images/investment-gold.jpg"
            alt="Investment portfolio growth with gold and wealth visualization"
            width={400}
            height={300}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Headline */}
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-8 text-balance">
            Welcome to Sanad Your AI-Powered Investment Guide
          </h1>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/signup")}
              className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold px-8 py-6 text-base rounded-md"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              className="bg-neutral-700 text-white hover:bg-neutral-600 border-none font-semibold px-8 py-6 text-base rounded-md"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
