"use client";

import { useState, useMemo } from "react";
import { Users, Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import {
  useContactGroups,
  useCreateContactGroup,
  useUpdateContactGroup,
  useDeleteContactGroup,
} from "@/hooks/useContactGroups";
import type {
  ContactGroupMemberInput,
  ContactGroupResponse,
} from "@/types/contact-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface MemberDraft {
  email: string;
  displayName: string;
}

const EMPTY_MEMBER: MemberDraft = { email: "", displayName: "" };

// ---------------------------------------------------------------------------
// Add / Edit dialog
// ---------------------------------------------------------------------------

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGroup: ContactGroupResponse | null;
  onClose: () => void;
}

function GroupDialog({
  open,
  onOpenChange,
  editingGroup,
  onClose,
}: GroupDialogProps) {
  const createMutation = useCreateContactGroup();
  const updateMutation = useUpdateContactGroup();

  // Seeded straight from props; the parent remounts this via `key` when the
  // group being edited changes, so no effect is needed to resync.
  const [name, setName] = useState(editingGroup?.name ?? "");
  const [members, setMembers] = useState<MemberDraft[]>(() =>
    editingGroup?.members.length
      ? editingGroup.members.map((m) => ({
          email: m.email,
          displayName: m.display_name ?? "",
        }))
      : [EMPTY_MEMBER]
  );
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const updateMember = (index: number, patch: Partial<MemberDraft>) => {
    setMembers((current) =>
      current.map((member, i) => (i === index ? { ...member, ...patch } : member))
    );
  };

  /**
   * Pasting a list of addresses into one field fans out into rows, so the
   * common case — copying recipients out of a mail client — doesn't mean typing
   * each one again.
   */
  const handleEmailInput = (index: number, raw: string) => {
    const parts = raw
      .split(/[,;\n\t]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      updateMember(index, { email: raw });
      return;
    }

    setMembers((current) => {
      const next = [...current];
      next.splice(
        index,
        1,
        ...parts.map((email) => ({ email, displayName: "" }))
      );
      return next;
    });
  };

  const removeMember = (index: number) => {
    setMembers((current) =>
      current.length === 1 ? [EMPTY_MEMBER] : current.filter((_, i) => i !== index)
    );
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Group name is required.");
      return;
    }

    const filled = members.filter((member) => member.email.trim());

    const invalid = filled.find(
      (member) => !EMAIL_PATTERN.test(member.email.trim())
    );
    if (invalid) {
      // The agent sends real mail to these addresses, and a send can't be
      // recalled — so a malformed one is refused here rather than at approval.
      setFormError(`"${invalid.email.trim()}" is not a valid email address.`);
      return;
    }

    const seen = new Set<string>();
    const payload: ContactGroupMemberInput[] = [];
    for (const member of filled) {
      const email = member.email.trim();
      const key = email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      payload.push({
        email,
        ...(member.displayName.trim()
          ? { display_name: member.displayName.trim() }
          : {}),
      });
    }

    setFormError(null);

    const onError = (err: unknown) =>
      setFormError(
        err instanceof Error ? err.message : "Failed to save contact group."
      );

    if (editingGroup) {
      updateMutation.mutate(
        { id: editingGroup.id, data: { name: trimmedName, members: payload } },
        { onSuccess: onClose, onError }
      );
    } else {
      createMutation.mutate(
        { name: trimmedName, members: payload },
        { onSuccess: onClose, onError }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? "Edit group" : "New contact group"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This is what you say in chat — &ldquo;email Team&rdquo;.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Members</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {members.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="name@example.com"
                    value={member.email}
                    onChange={(e) => handleEmailInput(index, e.target.value)}
                    disabled={isLoading}
                    className="flex-[3]"
                    aria-label={`Member ${index + 1} email`}
                  />
                  <Input
                    placeholder="Name (optional)"
                    value={member.displayName}
                    onChange={(e) =>
                      updateMember(index, { displayName: e.target.value })
                    }
                    disabled={isLoading}
                    className="flex-[2]"
                    aria-label={`Member ${index + 1} name`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember(index)}
                    disabled={isLoading}
                    aria-label={`Remove member ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMembers((current) => [...current, EMPTY_MEMBER])}
              disabled={isLoading}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add member
            </Button>
            <p className="text-xs text-muted-foreground">
              Pasting several addresses at once splits them into rows.
            </p>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving…"
                : editingGroup
                  ? "Save changes"
                  : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Group row
// ---------------------------------------------------------------------------

function GroupRow({
  group,
  onEdit,
}: {
  group: ContactGroupResponse;
  onEdit: (group: ContactGroupResponse) => void;
}) {
  const deleteMutation = useDeleteContactGroup();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {group.name}
          </span>
          <Badge variant="secondary" className="py-0 text-xs">
            {group.members.length}{" "}
            {group.members.length === 1 ? "member" : "members"}
          </Badge>
        </div>

        {group.members.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {group.members.map((member) => (
              <span
                key={member.id}
                title={member.email}
                className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {member.display_name || member.email}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            No members yet — the agent can&rsquo;t use this group until you add
            some.
          </p>
        )}

        <p className="mt-2 text-xs text-muted-foreground">
          Updated {formatRelativeTime(group.updated_at)}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label={`Edit ${group.name}`}
          onClick={() => onEdit(group)}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete ${group.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete group?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{group.name}&rdquo; and its {group.members.length}{" "}
                {group.members.length === 1 ? "member" : "members"} will be
                removed. Saying &ldquo;{group.name}&rdquo; in chat will stop
                working. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteMutation.mutate(group.id, {
                    onSuccess: () => setDeleteOpen(false),
                  })
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactGroupsPage() {
  const { data: groups, isLoading, error } = useContactGroups();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroupResponse | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (group) =>
        group.name.toLowerCase().includes(q) ||
        group.members.some(
          (member) =>
            member.email.toLowerCase().includes(q) ||
            member.display_name?.toLowerCase().includes(q)
        )
    );
  }, [groups, searchQuery]);

  function openAddDialog() {
    setEditingGroup(null);
    setDialogOpen(true);
  }

  function openEditDialog(group: ContactGroupResponse) {
    setEditingGroup(group);
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditingGroup(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Contact groups
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Name a set of people once, then say &ldquo;email Team&rdquo; in chat
          </p>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New group
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-auto px-6 py-4">
        {!isLoading && !error && groups && groups.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by group name or address…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-1/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load contact groups."}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && groups && groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="mb-1 text-base font-medium text-foreground">
              No contact groups yet
            </h3>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Group the people you email together, so you can name the group
              instead of listing everyone
            </p>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New group
            </Button>
          </div>
        )}

        {!isLoading &&
          !error &&
          groups &&
          groups.length > 0 &&
          filteredGroups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No groups match &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}

        {!isLoading && !error && filteredGroups.length > 0 && (
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <GroupRow
                key={group.id}
                group={group}
                onEdit={openEditDialog}
              />
            ))}
          </div>
        )}
      </div>

      <GroupDialog
        key={editingGroup?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setDialogOpen(true);
        }}
        editingGroup={editingGroup}
        onClose={handleDialogClose}
      />
    </div>
  );
}
