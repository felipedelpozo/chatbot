"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, KeyRound, PanelLeft, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChatApp } from "@/components/agents/chat-app";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageScroller,
} from "@/components/agents/message";
import { PromptInput } from "@/components/agents/prompt-input";
import { StreamingResponse } from "@/components/agents/streaming-response";
import {
  AnimatedSidebarInset,
  AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import { Button } from "@/components/motion/button";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { getMessageText } from "@/lib/chat-messages";
import { ModelSelector } from "./model-selector";
import { ProjectSidebar } from "./project-sidebar";
import { ProviderSettingsDialog } from "./provider-settings-dialog";
import type {
  ModelCatalogEntry,
  WorkspaceChatData,
  WorkspaceProjectSummary,
  WorkspaceUser,
} from "./types";

export interface ChatWorkspaceProps {
  chat: WorkspaceChatData;
  projectName: string;
  projects: WorkspaceProjectSummary[];
  models: ModelCatalogEntry[];
  user: WorkspaceUser;
}

export function ChatWorkspace({
  chat,
  projectName,
  projects,
  models,
  user,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const initialModel =
    models.find(
      (model) =>
        model.providerId === chat.providerId && model.modelId === chat.modelId,
    )?.id ?? models.find((model) => model.isDefault)?.id;
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isProviderSettingsOpen, setIsProviderSettingsOpen] = useState(false);
  const { messages, sendMessage, status, error, stop } = useChat({
    id: chat.id,
    messages: chat.messages,
    transport,
    onFinish: () => router.refresh(),
  });
  const isGenerating = status === "submitted" || status === "streaming";
  const hasConfiguredProvider = models.length > 0;
  const effectiveSelectedModel =
    models.find((model) => model.id === selectedModel && model.isAvailable)?.id ??
    models.find((model) => model.isDefault && model.isAvailable)?.id;

  async function selectModel(model: string) {
    const previous = effectiveSelectedModel;
    setSelectedModel(model);
    setModelError(null);
    const response = await fetch(`/api/chats/${chat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    if (!response.ok) {
      setSelectedModel(previous);
      const payload = await response.json().catch(() => null);
      setModelError(payload?.error?.message ?? "The model could not be selected.");
    }
  }

  async function submitPrompt(prompt: string) {
    setModelError(null);
    if (!effectiveSelectedModel) {
      setModelError("Connect a provider account before sending a prompt.");
      return;
    }
    await sendMessage(
      { text: prompt },
      { body: { chatId: chat.id, model: effectiveSelectedModel } },
    );
  }

  return (
    <ChatApp className="h-svh rounded-none border-0" sidebarWidth="17rem">
      <ProjectSidebar
        projects={projects}
        activeProjectId={projects.find((project) =>
          project.chats.some((candidate) => candidate.id === chat.id),
        )?.id}
        activeChatId={chat.id}
        user={user}
        onOpenSettings={() => setIsProviderSettingsOpen(true)}
      />

      <AnimatedSidebarInset className="min-h-0 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
              <PanelLeft className="size-4" />
            </AnimatedSidebarTrigger>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-medium text-foreground">
                {chat.title}
              </h1>
              <p className="truncate text-[11px] text-muted-foreground">
                Agent workspace · {projectName}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            {hasConfiguredProvider ? (
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                Provider ready
              </span>
            ) : (
              <div className="flex min-w-0 items-center justify-end gap-2.5">
                <p className="hidden max-w-56 text-right text-[11px] leading-4 text-muted-foreground lg:block">
                  Configure a provider account to use external AI models.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Configure a provider account"
                  onClick={() => setIsProviderSettingsOpen(true)}
                  className="shrink-0 border-amber-500/20 bg-amber-500/10 text-[11px] text-amber-800 outline-none hover:bg-amber-500/15 focus-visible:ring-2 focus-visible:ring-amber-500/35 dark:text-amber-300"
                >
                  <KeyRound className="size-3.5" />
                  Set up provider
                </Button>
              </div>
            )}
            <ThemeToggle
              variant="circle"
              start="top-right"
              className="size-8 shrink-0 rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              iconClassName="size-4"
            />
          </div>
        </header>

        <MessageScroller
          busy={isGenerating}
          navigation={messages.length > 2 ? "rail" : undefined}
          className="min-h-0 flex-1"
          viewportClassName="h-full"
          contentClassName="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-10"
        >
          {messages.length === 0 ? (
            <div className="grid min-h-[44vh] place-items-center text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid size-10 place-items-center rounded-2xl border border-border bg-muted/40 text-muted-foreground">
                  <Bot className="size-4" />
                </div>
                <h2 className="mt-4 text-base font-medium">Start a new task</h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {hasConfiguredProvider
                    ? "Describe what you want to explore, build, or understand."
                    : "Connect a provider account in Settings to choose a model and start a task."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              {messages.map((message, index) => {
                const content = getMessageText(message);
                const isAssistant = message.role === "assistant";
                const isLastStreaming =
                  isAssistant && isGenerating && index === messages.length - 1;

                return (
                  <Message
                    key={message.id}
                    from={isAssistant ? "assistant" : "user"}
                    animateIn={index >= chat.messages.length}
                  >
                    <MessageAvatar>
                      {isAssistant ? <Bot /> : <UserRound />}
                    </MessageAvatar>
                    <MessageContent>
                      {isAssistant ? (
                        <StreamingResponse
                          status={isLastStreaming ? "streaming" : "complete"}
                          copyText={content}
                          announce={isLastStreaming}
                          contentClassName="whitespace-pre-wrap"
                        >
                          {content}
                        </StreamingResponse>
                      ) : (
                        <MessageBubble variant="soft" animateIn={index >= chat.messages.length}>
                          <MessageBubbleContent className="whitespace-pre-wrap">
                            {content}
                          </MessageBubbleContent>
                        </MessageBubble>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}
            </div>
          )}
        </MessageScroller>

        <div className="shrink-0 bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
          <div className="mx-auto w-full max-w-3xl">
            {error || modelError ? (
              <div role="alert" className="mb-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {modelError ?? "The response could not be completed. Your message is saved; try again."}
              </div>
            ) : null}
            <PromptInput
              loading={isGenerating}
              onStop={stop}
              onSubmit={submitPrompt}
              disabled={!effectiveSelectedModel}
              maxLength={32_000}
              placeholder={
                effectiveSelectedModel
                  ? "Ask anything, @ mention, or add files"
                  : "Connect a provider to start"
              }
              leadingAction={
                <ModelSelector
                  models={models}
                  value={effectiveSelectedModel}
                  onValueChange={(value) => void selectModel(value)}
                  disabled={isGenerating}
                />
              }
            />
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              AI responses can be inaccurate. Verify important information.
            </p>
          </div>
        </div>
      </AnimatedSidebarInset>

      {isProviderSettingsOpen ? (
        <ProviderSettingsDialog onOpenChange={setIsProviderSettingsOpen} />
      ) : null}
    </ChatApp>
  );
}
