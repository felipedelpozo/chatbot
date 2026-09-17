"use client";

import {
  AISidebar,
  type SidebarResource,
  type SidebarResourceMenuControls,
} from "@/components/agents/ai-sidebar";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog } from "@base-ui/react/dialog";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarHeader,
  AnimatedSidebarRail,
} from "@/components/motion/animated-sidebar";
import {
  CirclePlay,
  FolderKanban,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AccountMenu } from "./account-menu";
import type {
  WorkspaceProjectSummary,
  WorkspaceUser,
} from "./types";

function projectResourceId(id: string) {
  return `project:${id}`;
}

function chatResourceId(id: string) {
  return `chat:${id}`;
}

function parseResourceId(id: string) {
  const separator = id.indexOf(":");
  return {
    kind: id.slice(0, separator),
    id: id.slice(separator + 1),
  };
}

async function apiRequest(path: string, init: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "The workspace could not be updated.");
  }
  return response;
}

const dialogBackdropClassName =
  "fixed inset-0 z-50 min-h-dvh bg-foreground/20 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0";

const dialogPopupClassName =
  "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";

const dialogSecondaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const dialogPrimaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

export interface ProjectSidebarProps {
  projects: WorkspaceProjectSummary[];
  activeProjectId?: string;
  activeChatId?: string;
  user: WorkspaceUser;
  onOpenSettings: () => void;
}

export function ProjectSidebar({
  projects,
  activeProjectId,
  activeChatId,
  user,
  onOpenSettings,
}: ProjectSidebarProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState("New project");
  const [pendingDeletion, setPendingDeletion] = useState<SidebarResource | null>(
    null,
  );
  const resources: SidebarResource[] = projects.map((project) => ({
    id: projectResourceId(project.id),
    label: project.name,
    kind: "project",
    children: project.chats.map((chat) => ({
      id: chatResourceId(chat.id),
      label: chat.title,
      kind: "file",
    })),
  }));

  function openCreateProjectDialog() {
    setProjectName("New project");
    setError(null);
    setIsCreateProjectOpen(true);
  }

  async function createProject(name: string) {
    name = name.trim();
    if (!name) return;
    setIsPending(true);
    setError(null);
    try {
      const response = await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      setIsCreateProjectOpen(false);
      router.push(`/projects/${result.project.id}/chats/${result.chat.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Project creation failed.");
    } finally {
      setIsPending(false);
    }
  }

  async function createChat(projectId = activeProjectId) {
    if (!projectId) {
      openCreateProjectDialog();
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const response = await apiRequest(`/api/projects/${projectId}/chats`, {
        method: "POST",
        body: JSON.stringify({ title: "New conversation" }),
      });
      const result = await response.json();
      router.push(`/projects/${projectId}/chats/${result.chat.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chat creation failed.");
    } finally {
      setIsPending(false);
    }
  }

  async function renameResource(item: SidebarResource, label: string) {
    const resource = parseResourceId(item.id);
    await apiRequest(
      resource.kind === "project"
        ? `/api/projects/${resource.id}`
        : `/api/chats/${resource.id}`,
      {
        method: "PATCH",
        body: JSON.stringify(
          resource.kind === "project" ? { name: label } : { title: label },
        ),
      },
    );
    router.refresh();
  }

  async function deleteResource(item: SidebarResource) {
    const resource = parseResourceId(item.id);
    const noun = resource.kind === "project" ? "project" : "chat";
    setIsPending(true);
    setError(null);
    try {
      await apiRequest(
        resource.kind === "project"
          ? `/api/projects/${resource.id}`
          : `/api/chats/${resource.id}`,
        { method: "DELETE" },
      );

      if (resource.kind === "project") {
        const fallback = projects.find((project) => project.id !== resource.id);
        const fallbackChat = fallback?.chats[0];
        router.push(
          fallback && fallbackChat
            ? `/projects/${fallback.id}/chats/${fallbackChat.id}`
            : "/",
        );
      } else if (resource.id === activeChatId) {
        const current = projects.find((project) => project.id === activeProjectId);
        const fallbackChat = current?.chats.find((chat) => chat.id !== resource.id);
        router.push(
          fallbackChat && current
            ? `/projects/${current.id}/chats/${fallbackChat.id}`
            : "/",
        );
      }
      setPendingDeletion(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Could not delete ${noun}.`);
    } finally {
      setIsPending(false);
    }
  }

  function renderMenu(item: SidebarResource, controls: SidebarResourceMenuControls) {
    return (
      <div className="grid gap-0.5">
        <button
          type="button"
          onClick={controls.rename}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none hover:bg-muted focus-visible:bg-muted"
        >
          <Pencil className="size-3.5" /> Rename
        </button>
        <button
          type="button"
          onClick={() => {
            controls.close();
            setPendingDeletion(item);
          }}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
    );
  }

  const navigationActions = [
    { label: "New task", icon: Plus, action: () => void createChat() },
    { label: "Search", icon: Search },
    { label: "Runs", icon: CirclePlay },
  ];

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void createProject(projectName);
  }

  const pendingDeletionResource = pendingDeletion
    ? parseResourceId(pendingDeletion.id)
    : null;
  const pendingDeletionNoun =
    pendingDeletionResource?.kind === "project" ? "project" : "chat";

  return (
    <>
      <AnimatedSidebar collapsible="offcanvas" ariaLabel="Workspace navigation">
      <AnimatedSidebarHeader className="gap-3 border-b border-border/70 px-3 pb-3 pt-4">
        <div className="flex h-8 items-center gap-2 px-1">
          <div className="grid size-7 place-items-center rounded-lg bg-foreground text-background">
            <span className="text-xs font-semibold">B</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">beUI AI Studio</span>
        </div>
        <div className="grid gap-0.5">
          {navigationActions.map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              disabled={!action || isPending}
              onClick={action}
              className="flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-55"
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </AnimatedSidebarHeader>

      <AnimatedSidebarContent className="px-2 py-3">
        <div className="mb-1 flex h-7 items-center justify-between px-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Projects
          </span>
          <button
            type="button"
            aria-label="Create project"
            title="Create project"
            disabled={isPending}
            onClick={openCreateProjectDialog}
            className="grid size-6 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        {resources.length ? (
          <AISidebar
            items={resources}
            activeId={activeChatId ? chatResourceId(activeChatId) : activeProjectId ? projectResourceId(activeProjectId) : null}
            defaultExpandedIds={projects.map((project) => projectResourceId(project.id))}
            onActiveChange={(resourceId) => {
              const resource = parseResourceId(resourceId);
              if (resource.kind !== "chat") return;
              const project = projects.find((candidate) =>
                candidate.chats.some((chat) => chat.id === resource.id),
              );
              if (project) router.push(`/projects/${project.id}/chats/${resource.id}`);
            }}
            onRename={renameResource}
            renderMenu={renderMenu}
            renderIcon={(item) =>
              item.kind === "project" ? (
                <FolderKanban className="size-4" />
              ) : (
                <MessageSquare className="size-4" />
              )
            }
            className="border-0 bg-transparent p-0"
          />
        ) : (
          <button
            type="button"
            onClick={openCreateProjectDialog}
            className="mx-1 mt-2 rounded-xl border border-dashed border-border px-3 py-4 text-left text-xs leading-5 text-muted-foreground outline-none hover:border-foreground/25 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Create your first project to start a conversation.
          </button>
        )}
        {error ? (
          <p role="alert" className="mx-2 mt-2 text-xs leading-5 text-destructive">
            {error}
          </p>
        ) : null}
      </AnimatedSidebarContent>

      <AnimatedSidebarFooter>
        <AccountMenu
          user={user}
          onOpenSettings={onOpenSettings}
        />
      </AnimatedSidebarFooter>
      <AnimatedSidebarRail />
      </AnimatedSidebar>

      <Dialog.Root
        open={isCreateProjectOpen}
        onOpenChange={(open) => {
          if (!isPending) setIsCreateProjectOpen(open);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={dialogBackdropClassName} />
          <Dialog.Popup className={dialogPopupClassName}>
            <form onSubmit={handleCreateProject} className="grid gap-5">
              <div className="grid gap-1.5">
                <Dialog.Title className="text-base font-semibold tracking-tight">
                  Create project
                </Dialog.Title>
                <Dialog.Description className="text-sm leading-6 text-muted-foreground">
                  Give this workspace a name. A first conversation will be created
                  automatically.
                </Dialog.Description>
              </div>

              <label className="grid gap-2 text-sm font-medium" htmlFor="project-name">
                Project name
                <input
                  id="project-name"
                  name="projectName"
                  autoFocus
                  required
                  maxLength={120}
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                />
              </label>

              {error ? (
                <p role="alert" className="text-xs leading-5 text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Dialog.Close
                  type="button"
                  disabled={isPending}
                  className={dialogSecondaryButtonClassName}
                >
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isPending || !projectName.trim()}
                  className={dialogPrimaryButtonClassName}
                >
                  {isPending ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={pendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingDeletion(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={dialogBackdropClassName} />
          <AlertDialog.Popup className={dialogPopupClassName}>
            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <AlertDialog.Title className="text-base font-semibold tracking-tight">
                  Delete {pendingDeletionNoun}?
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm leading-6 text-muted-foreground">
                  {pendingDeletionResource?.kind === "project"
                    ? `“${pendingDeletion?.label}” and all of its chats and messages will be permanently deleted.`
                    : `“${pendingDeletion?.label}” and all of its messages will be permanently deleted.`}
                </AlertDialog.Description>
              </div>

              {error ? (
                <p role="alert" className="text-xs leading-5 text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <AlertDialog.Close
                  type="button"
                  disabled={isPending}
                  className={dialogSecondaryButtonClassName}
                >
                  Cancel
                </AlertDialog.Close>
                <button
                  type="button"
                  disabled={isPending || !pendingDeletion}
                  onClick={() => {
                    if (pendingDeletion) void deleteResource(pendingDeletion);
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive/10 px-3 text-sm font-medium text-destructive outline-none transition-colors hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>

    </>
  );
}
