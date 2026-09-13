/**
 * A named set of email addresses. Saying "email Team1" in chat expands to the
 * members here before the agent asks you to approve the send, so the approval
 * card always lists the people who will actually be contacted.
 */

export interface ContactGroupMember {
  id: string;
  email: string;
  display_name: string;
}

export interface ContactGroupMemberInput {
  email: string;
  display_name?: string;
}

export interface ContactGroupResponse {
  id: string;
  name: string;
  members: ContactGroupMember[];
  created_at: string;
  updated_at: string;
}

export interface ContactGroupCreate {
  name: string;
  members?: ContactGroupMemberInput[];
}

export interface ContactGroupUpdate {
  name?: string;
  members?: ContactGroupMemberInput[];
}
