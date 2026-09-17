import type { UIMessage } from "ai";

export function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function toUIMessage(message: {
  id: string;
  role: string;
  content: string;
}): UIMessage {
  const role =
    message.role === "assistant" || message.role === "system"
      ? message.role
      : "user";

  return {
    id: message.id,
    role,
    parts: [{ type: "text", text: message.content }],
  };
}

