import type { Metadata } from "next"
import ChatUI from "@/components/chat-ui"
import { Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "ThreeCoders AI Assistant",
  description: "AI-powered assistant for all your questions",
}

/**
 * Chat page - Server Component wrapper
 * Renders the main chat interface with the AI assistant
 */
export default function ChatPage() {
  return (
    <main className="min-h-screen bg-background py-4 px-4 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5">
          <header className="relative bg-linear-to-r from-[oklch(0.45_0.25_280)] to-[oklch(0.55_0.2_260)] px-6 py-2 header-glow">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

            <div className="relative flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-white/90" />
              <h1 className="text-center text-xl font-semibold text-white md:text-xl tracking-tight">
                ByteAgents AI Assistant
              </h1>
            </div>
            <p className="relative mt-2 text-center text-sm text-white/70">Ask me anything — I&apos;m here to help</p>
          </header>

          {/* Chat UI component (client-side interactive) */}
          <ChatUI />
        </div>

        {/* <p className="mt-4 text-center text-xs text-muted-foreground">Powered by ByteAgents</p> */}
      </div>
    </main>
  )
}
