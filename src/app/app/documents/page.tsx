"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FileText, Upload, Trash2, CloudUpload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  useJobStatus,
} from "@/hooks/useDocuments";
import { getDocument } from "@/lib/api/documents";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import type { DocumentResponse } from "@/types/document";

// ---------------------------------------------------------------------------
// Accepted file config
// ---------------------------------------------------------------------------

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large. Maximum size is 50 MB (this file is ${formatBytes(file.size)}).`;
  }
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const validExt = ACCEPTED_EXTENSIONS.includes(ext);
  const validMime = ACCEPTED_MIME_TYPES.includes(file.type);
  if (!validExt && !validMime) {
    return "Unsupported file type. Please upload a PDF, DOCX, or TXT file.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: DocumentResponse["status"] }) {
  if (status === "processing") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
        Processing
      </Badge>
    );
  }
  if (status === "ready") {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Ready
      </Badge>
    );
  }
  return <Badge variant="destructive">Failed</Badge>;
}

// ---------------------------------------------------------------------------
// DocumentItem — handles per-document polling
// ---------------------------------------------------------------------------

interface DocumentItemProps {
  doc: DocumentResponse;
}

function DocumentItem({ doc }: DocumentItemProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDocument();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isProcessing = doc.status === "processing";
  const hasJobId = !!doc.job_id;

  // Poll via job status when job_id is present
  const { data: jobStatus } = useJobStatus(
    isProcessing && hasJobId ? doc.job_id : null
  );

  // Invalidate documents list when job finishes
  useEffect(() => {
    if (
      jobStatus?.status === "complete" ||
      jobStatus?.status === "error" ||
      jobStatus?.status === "not_found"
    ) {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  }, [jobStatus?.status, queryClient]);

  // Poll document directly when processing without a job_id
  const { data: polledDoc } = useQuery({
    queryKey: ["document", doc.id],
    queryFn: () => getDocument(doc.id),
    enabled: isProcessing && !hasJobId,
    refetchInterval: isProcessing && !hasJobId ? 3000 : false,
  });

  // Invalidate when direct poll resolves the status
  useEffect(() => {
    if (polledDoc && polledDoc.status !== "processing") {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  }, [polledDoc?.status, queryClient]);

  const handleDelete = () => {
    deleteMutation.mutate(doc.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      {/* Icon */}
      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/app/documents/${doc.id}`}
              className="text-sm font-medium text-foreground truncate hover:underline block"
              title={doc.filename}
            >
              {doc.filename}
            </Link>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {formatBytes(doc.file_size)}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <StatusBadge status={doc.status} />
              {doc.status === "ready" && doc.chunk_count !== null && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.chunk_count} chunks
                  </span>
                </>
              )}
              {doc.status === "failed" && doc.error_message && (
                <span
                  className="text-xs text-destructive truncate max-w-xs"
                  title={doc.error_message}
                >
                  {doc.error_message}
                </span>
              )}
            </div>
          </div>

          {/* Delete button */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Delete document"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{doc.filename}&rdquo; and
                  all associated data. This action cannot be undone.
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

        <p className="text-xs text-muted-foreground mt-2">
          Added {formatRelativeTime(doc.created_at)}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const { data, isLoading, error } = useDocuments();
  const uploadMutation = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const documents = data?.items ?? [];

  function handleFileSelected(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }
    setUploadError(null);
    uploadMutation.mutate(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelected(file);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
    // Reset input so same file can be re-uploaded after deletion
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const isUploading = uploadMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload files to use with RAG-powered chat
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Drag & drop upload zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted/80",
            isUploading && "pointer-events-none opacity-70"
          )}
        >
          <CloudUpload
            className={cn(
              "h-10 w-10 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground/60"
            )}
          />
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Drop file to upload" : "Drag & drop a file here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse — PDF, DOCX, TXT up to 50 MB
            </p>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="w-full max-w-xs">
              <Progress value={null} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1.5">
                Uploading…
              </p>
            </div>
          )}
        </div>

        {/* Upload errors */}
        {(uploadError || uploadMutation.isError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {uploadError ??
                (uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : "Upload failed. Please try again.")}
            </AlertDescription>
          </Alert>
        )}

        {/* Documents list */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Uploaded documents
          </h2>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Failed to load documents."}
              </AlertDescription>
            </Alert>
          )}

          {/* Empty state */}
          {!isLoading && !error && documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-medium text-foreground mb-1">
                No documents
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload your first document to use RAG
              </p>
            </div>
          )}

          {/* Document cards */}
          {!isLoading && !error && documents.length > 0 && (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentItem key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
