import { apiClient } from "./client";
import type { MemoryFactResponse, MemoryFactCreate, MemoryFactUpdate } from "@/types/memory";

export async function listMemory(): Promise<MemoryFactResponse[]> {
  return apiClient.get<MemoryFactResponse[]>("/memory");
}

export async function createMemoryFact(data: MemoryFactCreate): Promise<MemoryFactResponse> {
  return apiClient.post<MemoryFactResponse>("/memory", data);
}

export async function updateMemoryFact(
  id: string,
  data: MemoryFactUpdate
): Promise<MemoryFactResponse> {
  return apiClient.put<MemoryFactResponse>(`/memory/${id}`, data);
}

export async function deleteMemoryFact(id: string): Promise<void> {
  return apiClient.delete(`/memory/${id}`);
}
