export type MemorySource = "manual" | "auto";

export interface MemoryFactResponse {
  id: string;
  key: string;
  value: string;
  source: MemorySource;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryFactCreate {
  key: string;
  value: string;
  source?: MemorySource;
  confidence?: number;
}

export interface MemoryFactUpdate {
  key?: string;
  value?: string;
  confidence?: number;
}
