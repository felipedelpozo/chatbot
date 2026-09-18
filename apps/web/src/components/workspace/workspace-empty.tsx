"use client";

import { FolderPlus, Menu } from "lucide-react";
import { useState } from "react";
import { ChatApp } from "@/components/agents/chat-app";
import {
  AnimatedSidebarInset,
  AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import { ThemeToggle } from "@/components/motion/theme-toggle";
import { ProjectSidebar } from "./project-sidebar";
import { ProviderSettingsDialog } from "./provider-settings-dialog";
import type { WorkspaceProjectSummary, WorkspaceUser } from "./types";

export function WorkspaceEmpty({
  projects,
  user,
}: {
  projects: WorkspaceProjectSummary[];
  user: WorkspaceUser;
}) {
  const [isProviderSettingsOpen, setIsProviderSettingsOpen] = useState(false);

  return (
    <ChatApp className="h-svh rounded-none border-0" sidebarWidth="17rem">
      <ProjectSidebar
        projects={projects}
        user={user}
        onOpenSettings={() => setIsProviderSettingsOpen(true)}
      />
      <AnimatedSidebarInset className="min-h-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-3 sm:px-4">
          <AnimatedSidebarTrigger className="size-8 hover:bg-muted">
            <Menu className="size-4" />
          </AnimatedSidebarTrigger>
          <ThemeToggle
            variant="circle"
            start="top-right"
            className="size-8 shrink-0 rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            iconClassName="size-4"
          />
        </header>
        <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto grid size-11 place-items-center rounded-2xl border border-border bg-muted/40 text-muted-foreground">
              <FolderPlus className="size-4" />
            </div>
            <h1 className="mt-4 text-base font-medium">
              {projects.length ? "Choose or create a chat" : "Create your first project"}
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {projects.length
                ? "Use the project sidebar to continue a conversation or start a new task."
                : "Projects keep related conversations together. Use the plus button in the sidebar to begin."}
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
