"use client";

import { signOut } from "@beui-ai-studio/auth/client";
import { ChevronUp, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  MorphPopover,
  MorphPopoverContent,
  MorphPopoverTrigger,
} from "@/components/motion/popover-morph";
import type { WorkspaceUser } from "./types";

interface AccountMenuProps {
  user: WorkspaceUser;
  onOpenSettings: () => void;
}

export function AccountMenu({ user, onOpenSettings }: AccountMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    setIsPending(true);
    setIsOpen(false);
    await signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  function handleOpenSettings() {
    setIsOpen(false);
    onOpenSettings();
  }

  return (
    <MorphPopover
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) setIsOpen(open);
      }}
      className="w-full"
    >
      <MorphPopoverTrigger>
        <button
          type="button"
          aria-label={`Open account menu for ${user.name}`}
          disabled={isPending}
          className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-left outline-none transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-semibold text-background">
            {initials || "U"}
          </span>
          <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar-wrapper:hidden">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
          <ChevronUp className="mr-1 size-3.5 shrink-0 text-muted-foreground group-data-[state=collapsed]/sidebar-wrapper:hidden" />
        </button>
      </MorphPopoverTrigger>

      <MorphPopoverContent
        side="top"
        align="start"
        sideOffset={8}
        radius={14}
        className="w-60 p-1.5"
      >
        <div className="border-b border-border px-2.5 py-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <div className="grid gap-0.5 pt-1.5">
          <button
            type="button"
            onClick={handleOpenSettings}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="size-4 text-muted-foreground" />
            Settings
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => void handleSignOut()}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:opacity-50"
          >
            <LogOut className="size-4" />
            {isPending ? "Logging out…" : "Log out"}
          </button>
        </div>
      </MorphPopoverContent>
    </MorphPopover>
  );
}
