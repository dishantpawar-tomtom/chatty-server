import React from "react"
import rehypeMathjax from "rehype-mathjax"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import ErrorHandlerClearHistory from "@/components/Error/ErrorHandlerClearHistory"
import CodeBlock from "@/components/Markdown/CodeBlock"
import MemoizedReactMarkdown from "@/components/Markdown/MemoizedReactMarkdown"
import { Message, MessagePart, getMessageStringForDisplay, getMessageImageContent } from "@/types/chat"

interface Props {
  message: Message
  isComplete: boolean
}

const replaceNonAsciiWithinDollarsInString = (str: string) => {
  return str.replace(/\$(.*?)\$/g, (match) => {
    return match.replace(/[^\x00-\x7F]/g, "⍰")
  })
}

// Function to replace non-ASCII characters within dollar signs. The math renderer sometimes
// chokes on non-ASCII characters, so we replace them with a placeholder character.
const replaceNonAsciiWithinDollars = (content: MessagePart[] | string) => {
  if (typeof content === "string") {
    return replaceNonAsciiWithinDollarsInString(content)
  }
  return content.map((item) => {
    if (item.type === "text" && item.text) {
      return {
        ...item,
        text: replaceNonAsciiWithinDollarsInString(item.text)
      }
    }
    return item
  })
}

const MessageMarkdown = ({ message, isComplete }: Props) => {
  const messageContent = replaceNonAsciiWithinDollars(getMessageStringForDisplay(message));
  const imageContent = getMessageImageContent(message);

  // Convert each image to a Markdown string
  const imagesMarkdown = imageContent.map((image, index) => `![Image ${index}](${image})`).join("\n");

  return (
    <ErrorHandlerClearHistory>
      <MemoizedReactMarkdown
        className="prose flex-1 dark:prose-invert"
        remarkPlugins={[
          [remarkGfm, {}],
          [remarkMath, { inlineMath: [["$", "$"]], displayMath: [["$$", "$$"]] }]
        ]}
        rehypePlugins={[[rehypeMathjax, {}]]}
        components={{
          code({ node, inline, className, children, ...props }) {
            if (children.length) {
              if (children[0] == "▍") {
                return <span className="mt-1 animate-pulse cursor-default">▍</span>
              }
              children[0] = (children[0] as string).replace("▍", "▍")
            }

            const match = /language-(\w+)/.exec(className ?? "")
            return !inline ? (
              <CodeBlock
                key={Math.random()}
                language={(match && match[1]) || ""}
                value={String(children).replace(/\n\n$/, "\n")}
                {...props}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          table({ children }) {
            return <table className="border-collapse border border-black px-3 py-1 dark:border-white">{children}</table>
          },
          th({ children }) {
            return (
              <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td className="break-words border border-black px-3 py-1 dark:border-white">{children}</td>
          },
          // No need to override img here since we're handling images as Markdown strings
        }}
      >
        {`${messageContent}${!isComplete ? "`▍`" : ""}\n${imagesMarkdown}`}
      </MemoizedReactMarkdown>
    </ErrorHandlerClearHistory>
  )
}

export default MessageMarkdown;