"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDocuments,
  getDocument,
  uploadDocument,
  deleteDocument,
  getJobStatus,
} from "@/lib/api/documents";
import type { JobStatus } from "@/types/document";

export const DOCUMENTS_KEY = ["documents"] as const;
export const documentKey = (id: string) => ["document", id] as const;
export const jobStatusKey = (jobId: string) => ["jobStatus", jobId] as const;

const ACTIVE_JOB_STATUSES: JobStatus[] = ["queued", "in_progress"];

export function useDocuments() {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: listDocuments,
  });
}

export function useDocument(id: string | null) {
  return useQuery({
    queryKey: documentKey(id ?? ""),
    queryFn: () => getDocument(id!),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadDocument(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: documentKey(id) });
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: jobStatusKey(jobId ?? ""),
    queryFn: () => getJobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return false;
      return ACTIVE_JOB_STATUSES.includes(status) ? 2000 : false;
    },
  });
}
