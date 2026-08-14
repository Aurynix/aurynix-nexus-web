"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDocuments } from "@/hooks/useDocuments";
import { getDocumentChunks } from "@/lib/api/documents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, formatRelativeTime } from "@/lib/utils";
import { useState } from "react";

interface Props {
  params: Promise<{ documentId: string }>;
}

export default function DocumentDetailPage({ params }: Props) {
  const { documentId } = use(params);
  const { data: docs, isLoading, error } = useDocuments();
  const document = docs?.items.find((d) => d.id === documentId);

  const {
    data: chunks,
    isLoading: chunksLoading,
    error: chunksError,
  } = useQuery({
    queryKey: ["document-chunks", documentId],
    queryFn: () => getDocumentChunks(documentId),
    enabled: !!document && document.status === "ready",
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Document not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/app/documents">Back to documents</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-4" asChild>
          <Link href="/app/documents">
            <ArrowLeft className="h-4 w-4" />
            Documents
          </Link>
        </Button>

        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground break-all">
              {document.filename}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatBytes(document.file_size)} · {document.file_type.toUpperCase()}
            </p>
          </div>
          <StatusBadge status={document.status} />
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium text-foreground">Details</h2>
        <dl className="space-y-2 text-sm">
          <DetailRow label="Status" value={document.status} />
          <DetailRow
            label="Chunks"
            value={document.chunk_count !== null ? String(document.chunk_count) : "—"}
          />
          <DetailRow label="Uploaded" value={formatRelativeTime(document.created_at)} />
          <DetailRow label="Last updated" value={formatRelativeTime(document.updated_at)} />
          {document.error_message && (
            <DetailRow label="Error" value={document.error_message} isError />
          )}
        </dl>
      </div>

      {/* Chunks */}
      {document.status === "ready" && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            Chunks{chunks ? ` (${chunks.length})` : ""}
          </h2>

          {chunksLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          )}

          {chunksError && (
            <p className="text-sm text-destructive">
              {chunksError instanceof Error ? chunksError.message : "Failed to load chunks."}
            </p>
          )}

          {!chunksLoading && !chunksError && chunks && chunks.length === 0 && (
            <p className="text-sm text-muted-foreground">No chunks found.</p>
          )}

          {chunks && chunks.length > 0 && (
            <div className="space-y-2">
              {chunks.map((chunk) => (
                <ChunkCard key={chunk.index} chunk={chunk} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChunkCard({ chunk }: { chunk: { index: number; page: number | null; content: string } }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = chunk.content.length > 300;
  const preview = isLong && !expanded ? chunk.content.slice(0, 300) + "…" : chunk.content;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Chunk {chunk.index}
          </span>
          {chunk.page !== null && (
            <Badge variant="secondary" className="text-xs py-0">
              Page {chunk.page + 1}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {chunk.content.length} chars
        </span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
        {preview}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> Show more</>
          )}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <Badge variant="secondary" className="text-green-600 dark:text-green-400 border-green-500/20">
        Ready
      </Badge>
    );
  }
  if (status === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">Processing</Badge>;
}

function DetailRow({
  label,
  value,
  isError,
}: {
  label: string;
  value: string;
  isError?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground flex-shrink-0">{label}</dt>
      <dd className={isError ? "text-destructive text-right" : "text-foreground text-right"}>
        {value}
      </dd>
    </div>
  );
}
