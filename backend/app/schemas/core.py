from typing import Optional

from pydantic import BaseModel


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoleRead(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    archived: bool

    class Config:
        from_attributes = True


class PersonCreate(BaseModel):
    full_name: str
    role_id: str
    email_optional: Optional[str] = None


class PersonRead(BaseModel):
    id: str
    full_name: str
    role_id: str
    email_optional: Optional[str] = None
    is_active: bool
    archived: bool

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    title: str
    status: str = "Applied"
    description: Optional[str] = None
    funding_body_optional: Optional[str] = None
    start_date_optional: Optional[str] = None
    end_date_optional: Optional[str] = None
    created_by_person_id: Optional[str] = None


class ProjectRead(BaseModel):
    id: str
    project_code_optional: Optional[str] = None
    title: str
    status: str
    description: Optional[str] = None
    funding_body_optional: Optional[str] = None
    start_date_optional: Optional[str] = None
    end_date_optional: Optional[str] = None
    created_by_person_id: Optional[str] = None
    archived: bool

    class Config:
        from_attributes = True

class ResearchFieldCreate(BaseModel):
    name: str
    prefix: str
    description_optional: Optional[str] = None


class ActivityStageCreate(BaseModel):
    name: str
    ordering: int
    description_optional: Optional[str] = None


class PublicationStatusCreate(BaseModel):
    name: str
    ordering: int
    workflow_group: str


class ActivityDeadlinePayload(BaseModel):
    activity_stage_id: str
    deadline_optional: Optional[str] = None


class PublicationDeadlinePayload(BaseModel):
    publication_status_id: str
    deadline_optional: Optional[str] = None


class ActivityCreate(BaseModel):
    title: str
    field_id: str
    description: Optional[str] = None
    current_stage_id: str
    main_assignee_person_id: str
    supervisor_person_id: str
    created_by_person_id: Optional[str] = None
    collaborator_ids: list[str] = []
    project_ids: list[str] = []
    publication_ids: list[str] = []
    deadlines: list[ActivityDeadlinePayload] = []


class ActivityUpdate(BaseModel):
    title: str
    field_id: str
    description: Optional[str] = None
    current_stage_id: str
    main_assignee_person_id: str
    supervisor_person_id: str
    collaborator_ids: list[str] = []
    project_ids: list[str] = []
    publication_ids: list[str] = []
    deadlines: list[ActivityDeadlinePayload] = []


class PublicationCreate(BaseModel):
    type: str
    title: str
    current_status_id: str
    main_author_person_id: str
    supervisor_person_id: str
    journal_name_optional: Optional[str] = None
    conference_name_optional: Optional[str] = None
    conference_date_optional: Optional[str] = None
    conference_place_optional: Optional[str] = None
    description_optional: Optional[str] = None
    created_by_person_id: Optional[str] = None
    collaborator_ids: list[str] = []
    deadlines: list[PublicationDeadlinePayload] = []


class PublicationUpdate(BaseModel):
    type: str
    title: str
    current_status_id: str
    main_author_person_id: str
    supervisor_person_id: str
    journal_name_optional: Optional[str] = None
    conference_name_optional: Optional[str] = None
    conference_date_optional: Optional[str] = None
    conference_place_optional: Optional[str] = None
    description_optional: Optional[str] = None
    collaborator_ids: list[str] = []
    deadlines: list[PublicationDeadlinePayload] = []

class MeetingTypeCreate(BaseModel):
    name: str
    description_optional: Optional[str] = None


class MeetingPurposeCreate(BaseModel):
    name: str
    description_optional: Optional[str] = None


class MeetingCreate(BaseModel):
    title: str
    meeting_type_id: str
    organizer_person_id: str
    meeting_date: str
    start_time: str
    end_time_optional: Optional[str] = None
    description_optional: Optional[str] = None


class MeetingSlotCreate(BaseModel):
    meeting_id: str
    start_time: str
    end_time: str


class MeetingSlotTake(BaseModel):
    taken_by_person_id: str
    activity_id: str
    purpose_id: Optional[str] = None
    presenter_ids: list[str] = []
    description_optional: Optional[str] = None

class MasterThesisCreate(BaseModel):
    title: str
    keywords: Optional[str] = None
    related_activity_optional: Optional[str] = None
    related_project_optional: Optional[str] = None
    description: Optional[str] = None
    prerequisites: Optional[str] = None
    created_by_person_id: Optional[str] = None


class MasterThesisUpdate(BaseModel):
    title: str
    keywords: Optional[str] = None
    related_activity_optional: Optional[str] = None
    related_project_optional: Optional[str] = None
    description: Optional[str] = None
    prerequisites: Optional[str] = None


class MasterThesisAssign(BaseModel):
    student_name: str
    supervisor_ids: list[str]
    assigned_at: Optional[str] = None


class MasterThesisComplete(BaseModel):
    completed_at: Optional[str] = None