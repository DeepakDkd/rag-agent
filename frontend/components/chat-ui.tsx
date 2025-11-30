"use client"

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { Send, Bot, User, Loader2, Trash2, MessageSquare } from "lucide-react"
import MarkdownMessage from "./markdown"

// ============================================
// Types
// ============================================
interface Message {
  id: string
  role: "user" | "bot"
  content: string
  source?: "PDF" | "WEB"
  timestamp: Date
}

interface ApiResponse {
  answer: string
  source: "PDF" | "WEB"
}

const STORAGE_KEY = "threecoders-chat-history"

// ============================================
// Helper functions
// ============================================
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function loadMessagesFromStorage(): Message[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    // Convert timestamp strings back to Date objects
    return parsed.map((msg: Message) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }))
  } catch {
    return []
  }
}

function saveMessagesToStorage(messages: Message[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // Handle storage quota exceeded or other errors silently
  }
}

// ============================================
// Message Bubble Component
// ============================================
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("flex max-w-[95%] gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2",
            isUser ? "bg-primary ring-primary/30" : "bg-secondary ring-secondary/50",
          )}
        >
          {isUser ? (
            <User className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-secondary-foreground" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-secondary text-secondary-foreground rounded-bl-sm border border-border/50",
            )}
          >
            <MarkdownMessage content={message.content} />
            {/* {message.content} */}
          </div>

          {!isUser && message.source && (
            <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Source: {message.source}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// Thinking Indicator Component
// ============================================
function ThinkingIndicator() {
  return (
    <div className="flex w-full animate-in fade-in duration-200 justify-start">
      <div className="flex max-w-[85%] gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary ring-2 ring-secondary/50">
          <Bot className="h-4 w-4 text-secondary-foreground" />
        </div>

        <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border/50 bg-secondary px-4 py-3">
          <div className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
          </div>
          <span className="text-sm text-muted-foreground">Thinking…</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main ChatUI Component
// ============================================
export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = loadMessagesFromStorage()
    setMessages(stored)
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated && messages.length > 0) {
      saveMessagesToStorage(messages)
    }
  }, [messages, isHydrated])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    inputRef.current?.focus()
  }

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: userMessage.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
        
    let apiUrl = process.env.NEXT_PUBLIC_API_KEY || "";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage.trim() }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data: ApiResponse = await response.json()

      const botMsg: Message = {
        id: generateId(),
        role: "bot",
        content: data.answer,
        source: data.source,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errorMsg: Message = {
        id: generateId(),
        role: "bot",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="h-[70vh] overflow-y-auto px-4 py-4 md:px-6 scrollbar-thin">
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-[oklch(0.45_0.25_280)] to-[oklch(0.55_0.2_260)] shadow-lg shadow-primary/20">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Start a conversation</h2>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Ask me anything and I&apos;ll do my best to help you find the answer from our knowledge base.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["How can you help me?", "What sources do you use?", "Tell me about ThreeCoders"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="rounded-full border border-border bg-secondary/50 px-4 py-2 text-xs text-secondary-foreground transition-colors hover:bg-secondary hover:border-primary/30"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && <ThinkingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-4 md:px-6">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Clear history button */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                "border border-border bg-secondary/50 text-muted-foreground",
                "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                "transition-all duration-200",
              )}
              aria-label="Clear chat history"
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type your message..."
            className={cn(
              "flex-1 rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus:border-primary/50 focus:bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "transition-all duration-200",
            )}
            aria-label="Chat message input"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
            )}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-muted-foreground">Press Enter to send</p>
      </div>
    </div>
  )
}
