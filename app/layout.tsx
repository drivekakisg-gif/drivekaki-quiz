import type { Metadata } from "next"
import "./globals.css"
import Navigation from "@/components/Navigation"
import BottomNav from "@/components/BottomNav"
import SWRegister from "@/components/SWRegister"
import { GameProvider } from "@/context/GameContext"

export const metadata: Metadata = {
  title: "DriveKaki Theory — Singapore BTT/FTT Quiz",
  description: "Adaptive theory test practice for Singapore Basic Theory Test (BTT) and Final Theory Test (FTT).",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DriveKaki" },
  other: { "mobile-web-app-capable": "yes" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pb-16 md:pb-0">
        <GameProvider>
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <BottomNav />
          <SWRegister />
        </GameProvider>
      </body>
    </html>
  )
}
