"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMemory,
  createMemoryFact,
  updateMemoryFact,
  deleteMemoryFact,
} from "@/lib/api/memory";
import type { MemoryFactCreate, MemoryFactUpdate } from "@/types/memory";

export const MEMORY_KEY = ["memory"] as const;
export const memoryFactKey = (id: string) => ["memoryFact", id] as const;

export function useMemory() {
  return useQuery({
    queryKey: MEMORY_KEY,
    queryFn: listMemory,
  });
}

export function useCreateMemoryFact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MemoryFactCreate) => createMemoryFact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMORY_KEY });
    },
  });
}

export function useUpdateMemoryFact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MemoryFactUpdate }) =>
      updateMemoryFact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMORY_KEY });
    },
  });
}

export function useDeleteMemoryFact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMemoryFact(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: memoryFactKey(id) });
      queryClient.invalidateQueries({ queryKey: MEMORY_KEY });
    },
  });
}
