"use client";

import { useState, useEffect, useMemo } from "react";
import { Brain, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import {
  useMemory,
  useCreateMemoryFact,
  useUpdateMemoryFact,
  useDeleteMemoryFact,
} from "@/hooks/useMemory";
import type { MemoryFactCreate, MemoryFactUpdate } from "@/types/memory";
import type { MemoryFactResponse } from "@/types/memory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

// ---------------------------------------------------------------------------
// Add / Edit dialog
// ---------------------------------------------------------------------------

interface MemoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFact: MemoryFactResponse | null;
  onClose: () => void;
}

function MemoryDialog({
  open,
  onOpenChange,
  editingFact,
  onClose,
}: MemoryDialogProps) {
  const createMutation = useCreateMemoryFact();
  const updateMutation = useUpdateMemoryFact();

  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Sync form when editing fact changes
  useEffect(() => {
    if (editingFact) {
      setKey(editingFact.key);
      setValue(editingFact.value);
    } else {
      setKey("");
      setValue("");
    }
    setFormError(null);
  }, [editingFact, open]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedKey = key.trim();
    const trimmedValue = value.trim();

    if (!trimmedKey) {
      setFormError("Key is required.");
      return;
    }
    if (!trimmedValue) {
      setFormError("Value is required.");
      return;
    }

    setFormError(null);

    if (editingFact) {
      const updateData: MemoryFactUpdate = {};
      if (trimmedKey !== editingFact.key) updateData.key = trimmedKey;
      if (trimmedValue !== editingFact.value) updateData.value = trimmedValue;

      updateMutation.mutate(
        { id: editingFact.id, data: updateData },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err) => {
            setFormError(
              err instanceof Error ? err.message : "Failed to update memory."
            );
          },
        }
      );
    } else {
      const createData: MemoryFactCreate = {
        key: trimmedKey,
        value: trimmedValue,
        source: "manual",
      };

      createMutation.mutate(createData, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          setFormError(
            err instanceof Error ? err.message : "Failed to save memory."
          );
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingFact ? "Edit memory" : "Add memory"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="memory-key">Key</Label>
            <Input
              id="memory-key"
              placeholder="e.g. Preferred language"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memory-value">Value</Label>
            <Textarea
              id="memory-value"
              placeholder="e.g. English"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? editingFact
                  ? "Saving…"
                  : "Adding…"
                : editingFact
                  ? "Save changes"
                  : "Add memory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Memory fact row
// ---------------------------------------------------------------------------

interface MemoryFactRowProps {
  fact: MemoryFactResponse;
  onEdit: (fact: MemoryFactResponse) => void;
}

function MemoryFactRow({ fact, onEdit }: MemoryFactRowProps) {
  const deleteMutation = useDeleteMemoryFact();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const confidencePercent = Math.round(fact.confidence * 100);

  const handleDelete = () => {
    deleteMutation.mutate(fact.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {fact.key}
          </span>
          {fact.source === "manual" ? (
            <Badge variant="outline" className="text-xs py-0">
              manual
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs py-0">
              auto
            </Badge>
          )}
          {fact.confidence < 1.0 && (
            <span className="text-xs text-muted-foreground">
              Confidence: {confidencePercent}%
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 break-words">
          {fact.value}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Updated {formatRelativeTime(fact.updated_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          aria-label="Edit memory"
          onClick={() => onEdit(fact)}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Delete memory"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete memory?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the memory fact &ldquo;{fact.key}
                &rdquo;. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
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

export default function MemoryPage() {
  const { data: facts, isLoading, error } = useMemory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<MemoryFactResponse | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFacts = useMemo(() => {
    if (!facts) return [];
    if (!searchQuery.trim()) return facts;
    const q = searchQuery.toLowerCase();
    return facts.filter(
      (f) =>
        f.key.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)
    );
  }, [facts, searchQuery]);

  function openAddDialog() {
    setEditingFact(null);
    setDialogOpen(true);
  }

  function openEditDialog(fact: MemoryFactResponse) {
    setEditingFact(fact);
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setEditingFact(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Memory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Facts the assistant remembers about you
          </p>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add memory
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {/* Search — only show when there are facts */}
        {!isLoading && !error && facts && facts.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by key or value…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/5 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load memory facts."}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty state (no facts at all) */}
        {!isLoading && !error && facts && facts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Brain className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-base font-medium text-foreground mb-1">
              No memories yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add information about yourself or your business to personalise the
              assistant
            </p>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add memory
            </Button>
          </div>
        )}

        {/* Empty search state */}
        {!isLoading &&
          !error &&
          facts &&
          facts.length > 0 &&
          filteredFacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No memories match &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}

        {/* Memory facts list */}
        {!isLoading && !error && filteredFacts.length > 0 && (
          <div className="space-y-3">
            {filteredFacts.map((fact) => (
              <MemoryFactRow
                key={fact.id}
                fact={fact}
                onEdit={openEditDialog}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <MemoryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setDialogOpen(true);
        }}
        editingFact={editingFact}
        onClose={handleDialogClose}
      />
    </div>
  );
}
