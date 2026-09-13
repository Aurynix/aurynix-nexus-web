"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listContactGroups,
  createContactGroup,
  updateContactGroup,
  deleteContactGroup,
} from "@/lib/api/contact-groups";
import type {
  ContactGroupCreate,
  ContactGroupUpdate,
} from "@/types/contact-group";

export const CONTACT_GROUPS_KEY = ["contactGroups"] as const;

export function useContactGroups() {
  return useQuery({
    queryKey: CONTACT_GROUPS_KEY,
    queryFn: listContactGroups,
  });
}

export function useCreateContactGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContactGroupCreate) => createContactGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_GROUPS_KEY });
    },
  });
}

export function useUpdateContactGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactGroupUpdate }) =>
      updateContactGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_GROUPS_KEY });
    },
  });
}

export function useDeleteContactGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContactGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACT_GROUPS_KEY });
    },
  });
}
