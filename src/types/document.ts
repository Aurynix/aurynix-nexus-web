export type DocumentStatus = "processing" | "ready" | "failed";
export type DocumentFileType = "pdf" | "docx" | "txt";

export interface DocumentResponse {
  id: string;
  filename: string;
  file_type: DocumentFileType;
  file_size: number;
  status: DocumentStatus;
  chunk_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  job_id: string | null;
}

export interface DocumentListResponse {
  items: DocumentResponse[];
  total: number;
}

export type JobStatus =
  | "queued"
  | "in_progress"
  | "complete"
  | "not_found"
  | "error";

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  result: {
    doc_id: string;
    status: "ready" | "failed";
    chunk_count: number;
  } | null;
}
