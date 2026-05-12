const API_BASE_URL = "https://betalab-raci.onrender.com/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API error ${response.status}: ${errorText || response.statusText}`
    );
  }

  return response.json();
}

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  archived?: boolean;
};

export type Person = {
  id: string;
  full_name: string;
  role_id: string;
  email_optional?: string | null;
  is_active: boolean;
  archived: boolean;
};

export type Project = {
  id: string;
  project_code_optional?: string | null;
  title: string;
  status: string;
  description?: string | null;
  funding_body_optional?: string | null;
  start_date_optional?: string | null;
  end_date_optional?: string | null;
  created_by_person_id?: string | null;
  archived: boolean;
};

export type CreateRolePayload = {
  name: string;
  description?: string | null;
};

export type CreatePersonPayload = {
  full_name: string;
  role_id: string;
  email_optional?: string | null;
};

export type CreateProjectPayload = {
  title: string;
  status?: string;
  description?: string | null;
  funding_body_optional?: string | null;
  start_date_optional?: string | null;
  end_date_optional?: string | null;
  created_by_person_id?: string | null;
};

export async function getRoles(): Promise<Role[]> {
  return request<Role[]>("/roles");
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  return request<Role>("/roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPeople(): Promise<Person[]> {
  return request<Person[]>("/people");
}

export async function createPerson(
  payload: CreatePersonPayload
): Promise<Person> {
  return request<Person>("/people", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProjects(): Promise<Project[]> {
  return request<Project[]>("/projects");
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProject(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`);
}

export async function updateProject(
  projectId: string,
  payload: CreateProjectPayload
): Promise<Project> {
  return request<Project>(`/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function archiveProject(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}/archive`, {
    method: "PATCH",
  });
}

export type ResearchField = {
  id: string;
  name: string;
  prefix: string;
  description_optional?: string | null;
};

export type ActivityStage = {
  id: string;
  name: string;
  ordering: number;
  description_optional?: string | null;
};

export type PublicationStatus = {
  id: string;
  name: string;
  ordering: number;
  workflow_group: string;
};

export type LinkedPerson = {
  id: string;
  full_name: string;
};

export type LinkedProject = {
  id: string;
  title: string;
};

export type LinkedPublication = {
  id: string;
  publication_code: string;
  title: string;
  type: string;
};

export type ActivityDeadline = {
  id?: string;
  activity_stage_id: string;
  stage_name?: string | null;
  stage_ordering?: number | null;
  deadline_optional?: string | null;
};

export type Activity = {
  id: string;
  activity_code: string;
  title: string;
  field_id: string;
  field_name?: string | null;
  description?: string | null;
  current_stage_id: string;
  current_stage_name?: string | null;
  main_assignee_person_id: string;
  main_assignee_name?: string | null;
  supervisor_person_id: string;
  supervisor_name?: string | null;
  last_presented_at_optional?: string | null;
  archived: boolean;
  collaborators: LinkedPerson[];
  projects: LinkedProject[];
  publications: LinkedPublication[];
  deadlines: ActivityDeadline[];
};

export type Publication = {
  id: string;
  publication_code: string;
  type: string;
  title: string;
  current_status_id: string;
  current_status_name?: string | null;
  main_author_person_id: string;
  main_author_name?: string | null;
  supervisor_person_id: string;
  supervisor_name?: string | null;
  journal_name_optional?: string | null;
  conference_name_optional?: string | null;
  conference_date_optional?: string | null;
  conference_place_optional?: string | null;
  description_optional?: string | null;
  archived: boolean;
};

export type ActivityPayload = {
  title: string;
  field_id: string;
  description?: string | null;
  current_stage_id: string;
  main_assignee_person_id: string;
  supervisor_person_id: string;
  created_by_person_id?: string | null;
  collaborator_ids: string[];
  project_ids: string[];
  publication_ids: string[];
  deadlines: {
    activity_stage_id: string;
    deadline_optional?: string | null;
  }[];
};

export async function getResearchFields(): Promise<ResearchField[]> {
  return request<ResearchField[]>("/research-fields");
}

export async function getActivityStages(): Promise<ActivityStage[]> {
  return request<ActivityStage[]>("/activity-stages");
}

export async function getPublicationStatuses(): Promise<PublicationStatus[]> {
  return request<PublicationStatus[]>("/publication-statuses");
}

export async function getPublications(): Promise<Publication[]> {
  return request<Publication[]>("/publications");
}

export async function getActivities(): Promise<Activity[]> {
  return request<Activity[]>("/activities");
}

export async function createActivity(payload: ActivityPayload): Promise<Activity> {
  return request<Activity>("/activities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateActivity(
  activityId: string,
  payload: ActivityPayload
): Promise<Activity> {
  return request<Activity>(`/activities/${activityId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function archiveActivity(activityId: string): Promise<Activity> {
  return request<Activity>(`/activities/${activityId}/archive`, {
    method: "PATCH",
  });
}

export type PublicationDeadline = {
  id?: string;
  publication_status_id: string;
  status_name?: string | null;
  status_ordering?: number | null;
  deadline_optional?: string | null;
};

export type LinkedActivity = {
  id: string;
  activity_code: string;
  title: string;
};

export type FullPublication = Publication & {
  collaborators: LinkedPerson[];
  deadlines: PublicationDeadline[];
  activities: LinkedActivity[];
};

export type PublicationPayload = {
  type: string;
  title: string;
  current_status_id: string;
  main_author_person_id: string;
  supervisor_person_id: string;
  journal_name_optional?: string | null;
  conference_name_optional?: string | null;
  conference_date_optional?: string | null;
  conference_place_optional?: string | null;
  description_optional?: string | null;
  created_by_person_id?: string | null;
  collaborator_ids: string[];
  deadlines: {
    publication_status_id: string;
    deadline_optional?: string | null;
  }[];
};

export async function getFullPublications(): Promise<FullPublication[]> {
  return request<FullPublication[]>("/publications");
}

export async function createPublication(
  payload: PublicationPayload
): Promise<FullPublication> {
  return request<FullPublication>("/publications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePublication(
  publicationId: string,
  payload: PublicationPayload
): Promise<FullPublication> {
  return request<FullPublication>(`/publications/${publicationId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function archivePublication(
  publicationId: string
): Promise<FullPublication> {
  return request<FullPublication>(`/publications/${publicationId}/archive`, {
    method: "PATCH",
  });
}

export type MeetingType = {
  id: string;
  name: string;
  description_optional?: string | null;
};

export type MeetingPurpose = {
  id: string;
  name: string;
  description_optional?: string | null;
};

export type MeetingSlotPresenter = {
  id: string;
  full_name: string;
};

export type MeetingSlot = {
  id: string;
  meeting_id: string;
  start_time: string;
  end_time: string;
  status: string;
  taken_by_person_id_optional?: string | null;
  taken_by_name?: string | null;
  activity_id_optional?: string | null;
  activity_code?: string | null;
  activity_title?: string | null;
  purpose_id_optional?: string | null;
  purpose_name?: string | null;
  description_optional?: string | null;
  confirmed_presented: boolean;
  presenters: MeetingSlotPresenter[];
};

export type Meeting = {
  id: string;
  title: string;
  meeting_type_id: string;
  meeting_type_name?: string | null;
  organizer_person_id: string;
  organizer_name?: string | null;
  meeting_date: string;
  start_time: string;
  end_time_optional?: string | null;
  description_optional?: string | null;
  archived: boolean;
  slots: MeetingSlot[];
};

export type MeetingPayload = {
  title: string;
  meeting_type_id: string;
  organizer_person_id: string;
  meeting_date: string;
  start_time: string;
  end_time_optional?: string | null;
  description_optional?: string | null;
};

export type MeetingSlotPayload = {
  meeting_id: string;
  start_time: string;
  end_time: string;
};

export type TakeSlotPayload = {
  taken_by_person_id: string;
  activity_id: string;
  purpose_id?: string | null;
  presenter_ids: string[];
  description_optional?: string | null;
};

export async function getMeetingTypes(): Promise<MeetingType[]> {
  return request<MeetingType[]>("/meeting-types");
}

export async function getMeetingPurposes(): Promise<MeetingPurpose[]> {
  return request<MeetingPurpose[]>("/meeting-purposes");
}

export async function getMeetings(): Promise<Meeting[]> {
  return request<Meeting[]>("/meetings");
}

export async function createMeeting(payload: MeetingPayload): Promise<Meeting> {
  return request<Meeting>("/meetings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createMeetingSlot(
  payload: MeetingSlotPayload
): Promise<MeetingSlot> {
  return request<MeetingSlot>("/meeting-slots", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function takeMeetingSlot(
  slotId: string,
  payload: TakeSlotPayload
): Promise<MeetingSlot> {
  return request<MeetingSlot>(`/meeting-slots/${slotId}/take`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function releaseMeetingSlot(slotId: string): Promise<MeetingSlot> {
  return request<MeetingSlot>(`/meeting-slots/${slotId}/release`, {
    method: "POST",
  });
}

export async function confirmMeetingSlot(slotId: string): Promise<MeetingSlot> {
  return request<MeetingSlot>(`/meeting-slots/${slotId}/confirm`, {
    method: "POST",
  });
}

export type ThesisSupervisor = {
  id: string;
  full_name: string;
};

export type MasterThesis = {
  id: string;
  thesis_code: string;
  title: string;
  keywords?: string | null;
  related_activity_optional?: string | null;
  related_activity_code?: string | null;
  related_activity_title?: string | null;
  related_project_optional?: string | null;
  related_project_title?: string | null;
  description?: string | null;
  prerequisites?: string | null;
  status: string;
  student_name_optional?: string | null;
  created_by_person_id?: string | null;
  created_by_name?: string | null;
  assigned_at_optional?: string | null;
  completed_at_optional?: string | null;
  archived: boolean;
  supervisors: ThesisSupervisor[];
};

export type MasterThesisPayload = {
  title: string;
  keywords?: string | null;
  related_activity_optional?: string | null;
  related_project_optional?: string | null;
  description?: string | null;
  prerequisites?: string | null;
  created_by_person_id?: string | null;
};

export type MasterThesisAssignPayload = {
  student_name: string;
  supervisor_ids: string[];
  assigned_at?: string | null;
};

export type MasterThesisCompletePayload = {
  completed_at?: string | null;
};

export async function getMasterTheses(): Promise<MasterThesis[]> {
  return request<MasterThesis[]>("/master-theses");
}

export async function createMasterThesis(
  payload: MasterThesisPayload
): Promise<MasterThesis> {
  return request<MasterThesis>("/master-theses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMasterThesis(
  thesisId: string,
  payload: MasterThesisPayload
): Promise<MasterThesis> {
  return request<MasterThesis>(`/master-theses/${thesisId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function assignMasterThesis(
  thesisId: string,
  payload: MasterThesisAssignPayload
): Promise<MasterThesis> {
  return request<MasterThesis>(`/master-theses/${thesisId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeMasterThesis(
  thesisId: string,
  payload: MasterThesisCompletePayload
): Promise<MasterThesis> {
  return request<MasterThesis>(`/master-theses/${thesisId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function archiveMasterThesis(
  thesisId: string
): Promise<MasterThesis> {
  return request<MasterThesis>(`/master-theses/${thesisId}/archive`, {
    method: "PATCH",
  });
}

export type CreateResearchFieldPayload = {
  name: string;
  prefix: string;
  description_optional?: string | null;
};

export type CreateActivityStagePayload = {
  name: string;
  ordering: number;
  description_optional?: string | null;
};

export type CreatePublicationStatusPayload = {
  name: string;
  ordering: number;
  workflow_group: string;
};

export type CreateMeetingPurposePayload = {
  name: string;
  description_optional?: string | null;
};

export async function createResearchField(
  payload: CreateResearchFieldPayload
): Promise<ResearchField> {
  return request<ResearchField>("/research-fields", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createActivityStage(
  payload: CreateActivityStagePayload
): Promise<ActivityStage> {
  return request<ActivityStage>("/activity-stages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createPublicationStatus(
  payload: CreatePublicationStatusPayload
): Promise<PublicationStatus> {
  return request<PublicationStatus>("/publication-statuses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createMeetingPurpose(
  payload: CreateMeetingPurposePayload
): Promise<MeetingPurpose> {
  return request<MeetingPurpose>("/meeting-purposes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRole(
  roleId: string,
  payload: CreateRolePayload
): Promise<Role> {
  return request<Role>(`/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRole(roleId: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/roles/${roleId}`, {
    method: "DELETE",
  });
}

export async function updatePerson(
  personId: string,
  payload: CreatePersonPayload
): Promise<Person> {
  return request<Person>(`/people/${personId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePerson(personId: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/people/${personId}`, {
    method: "DELETE",
  });
}

export async function updateResearchField(
  fieldId: string,
  payload: CreateResearchFieldPayload
): Promise<ResearchField> {
  return request<ResearchField>(`/research-fields/${fieldId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteResearchField(
  fieldId: string
): Promise<{ status: string }> {
  return request<{ status: string }>(`/research-fields/${fieldId}`, {
    method: "DELETE",
  });
}

export async function updateActivityStage(
  stageId: string,
  payload: CreateActivityStagePayload
): Promise<ActivityStage> {
  return request<ActivityStage>(`/activity-stages/${stageId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteActivityStage(
  stageId: string
): Promise<{ status: string }> {
  return request<{ status: string }>(`/activity-stages/${stageId}`, {
    method: "DELETE",
  });
}

export async function updatePublicationStatus(
  statusId: string,
  payload: CreatePublicationStatusPayload
): Promise<PublicationStatus> {
  return request<PublicationStatus>(`/publication-statuses/${statusId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePublicationStatus(
  statusId: string
): Promise<{ status: string }> {
  return request<{ status: string }>(`/publication-statuses/${statusId}`, {
    method: "DELETE",
  });
}

export async function updateMeetingPurpose(
  purposeId: string,
  payload: CreateMeetingPurposePayload
): Promise<MeetingPurpose> {
  return request<MeetingPurpose>(`/meeting-purposes/${purposeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMeetingPurpose(
  purposeId: string
): Promise<{ status: string }> {
  return request<{ status: string }>(`/meeting-purposes/${purposeId}`, {
    method: "DELETE",
  });
}

export async function deactivatePerson(
  personId: string
): Promise<Person> {
  return request<Person>(`/people/${personId}/deactivate`, {
    method: "PATCH",
  });
}

export type LogEntry = {
  id: string;
  actor_person_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  summary?: string | null;
  timestamp: string;
};

export async function getLogs(): Promise<LogEntry[]> {
  return request<LogEntry[]>("/logs");
}