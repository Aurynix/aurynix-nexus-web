import { apiClient } from "./client";
import type { DocumentResponse, DocumentListResponse, JobStatusResponse } from "@/types/document";

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<DocumentResponse>("/documents/upload", formData);
}

export async function listDocuments(): Promise<DocumentListResponse> {
  return apiClient.get<DocumentListResponse>("/documents");
}

export async function getDocument(id: string): Promise<DocumentResponse> {
  return apiClient.get<DocumentResponse>(`/documents/${id}`);
}

export async function deleteDocument(id: string): Promise<void> {
  return apiClient.delete(`/documents/${id}`);
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return apiClient.get<JobStatusResponse>(`/documents/jobs/${jobId}`);
}

export interface DocumentChunk {
  index: number;
  page: number | null;
  content: string;
}

export async function getDocumentChunks(id: string): Promise<DocumentChunk[]> {
  return apiClient.get<DocumentChunk[]>(`/documents/${id}/chunks`);
}
