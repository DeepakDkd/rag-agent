"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import "prismjs/themes/prism-tomorrow.css";

type MarkdownMessageProps = {
  content: string;
};

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypePrism]}
      components={{
        code({ node, className, children, ...props }) {
          const isCodeBlock = className?.startsWith("language-");

          if ( isCodeBlock) {
            return (
              <CopyableCodeBlock className={className}>
                {children}
              </CopyableCodeBlock>
            );
          }

          return (
            <code
              className={`${className ?? ""} px-1 rounded bg-bg-slate-900/40 md:text-base text-xs wrap-break-words`}
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

type CopyableProps = {
  children: React.ReactNode;
  className?: string;
};

function CopyableCodeBlock({ children, className }: CopyableProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement | null>(null);

  const copyToClipboard = async () => {
    if (!codeRef.current) return;
    const text = codeRef.current.innerText;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const childString = String(
    Array.isArray(children) ? children.join("") : children
  ).trim();

  const shouldShowCopyButton = childString.length > 50;

  return (
    <div className="relative group markdown">
      {shouldShowCopyButton && (
        <button
          type="button"
          onClick={copyToClipboard}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity 
                     px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 
                     text-white rounded border border-slate-600 z-10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      )}

      <pre
        className="
          p-4 rounded-xl overflow-x-auto bg-slate-900/70

          whitespace-pre-wrap wrap-break-words break-all

          text-[11px] leading-tight
          sm:text-xs sm:leading-snug
          md:text-sm md:leading-normal
          lg:text-base lg:leading-relaxed
          m-0
        "
      >
        <code
          ref={codeRef}
          className={`
            ${className ?? ""}

            whitespace-pre-wrap wrap-break-words break-all
            
            text-[8px] leading-tight
    sm:text-[9px] sm:leading-snug
md:text-[10px] md:leading-normal
lg:text-xs lg:leading-relaxed

            
          `}
        >
          {children}
        </code>
      </pre>
    </div>
  );
}
