import type { Metadata } from "next"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { LoginForm } from "@/components/login-form"
import { ChartComponent } from "@/components/chart-component"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Sanad - AI-Powered Investment Guide",
  description: "Your guide to smart investments with AI-powered insights",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Header />
      <HeroSection />
      <LoginForm />
      <ChartComponent />
      <Footer />
    </main>
  )
}
