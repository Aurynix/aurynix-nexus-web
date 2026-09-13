import { apiClient } from "./client";
import type {
  ContactGroupCreate,
  ContactGroupResponse,
  ContactGroupUpdate,
} from "@/types/contact-group";

export async function listContactGroups(): Promise<ContactGroupResponse[]> {
  return apiClient.get<ContactGroupResponse[]>("/contact-groups");
}

export async function createContactGroup(
  data: ContactGroupCreate
): Promise<ContactGroupResponse> {
  return apiClient.post<ContactGroupResponse>("/contact-groups", data);
}

// The backend takes a partial update here — PATCH, not PUT.
export async function updateContactGroup(
  id: string,
  data: ContactGroupUpdate
): Promise<ContactGroupResponse> {
  return apiClient.patch<ContactGroupResponse>(`/contact-groups/${id}`, data);
}

export async function deleteContactGroup(id: string): Promise<void> {
  return apiClient.delete(`/contact-groups/${id}`);
}
