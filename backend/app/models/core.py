from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    people: Mapped[list["Person"]] = relationship(back_populates="role")


class Person(Base):
    __tablename__ = "people"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), nullable=False)
    email_optional: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    role: Mapped["Role"] = relationship(back_populates="people")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_code_optional: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="Applied")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    funding_body_optional: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_date_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    end_date_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_by_person_id: Mapped[Optional[str]] = mapped_column(ForeignKey("people.id"), nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class Log(Base):
    __tablename__ = "logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    actor_person_id: Mapped[Optional[str]] = mapped_column(ForeignKey("people.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_fields_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class ResearchField(Base):
    __tablename__ = "research_fields"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    prefix: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    description_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ActivityStage(Base):
    __tablename__ = "activity_stages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    ordering: Mapped[int] = mapped_column(Integer, nullable=False)
    description_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class PublicationStatus(Base):
    __tablename__ = "publication_statuses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    ordering: Mapped[int] = mapped_column(Integer, nullable=False)
    workflow_group: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Publication(Base):
    __tablename__ = "publications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    publication_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    current_status_id: Mapped[str] = mapped_column(ForeignKey("publication_statuses.id"), nullable=False)
    main_author_person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    supervisor_person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    journal_name_optional: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    conference_name_optional: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    conference_date_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    conference_place_optional: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    description_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by_person_id: Mapped[Optional[str]] = mapped_column(ForeignKey("people.id"), nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class PublicationCollaborator(Base):
    __tablename__ = "publication_collaborators"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    publication_id: Mapped[str] = mapped_column(ForeignKey("publications.id"), nullable=False)
    person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class PublicationDeadline(Base):
    __tablename__ = "publication_deadlines"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    publication_id: Mapped[str] = mapped_column(ForeignKey("publications.id"), nullable=False)
    publication_status_id: Mapped[str] = mapped_column(ForeignKey("publication_statuses.id"), nullable=False)
    deadline_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    activity_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    field_id: Mapped[str] = mapped_column(ForeignKey("research_fields.id"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_stage_id: Mapped[str] = mapped_column(ForeignKey("activity_stages.id"), nullable=False)
    main_assignee_person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    supervisor_person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    last_presented_at_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_by_person_id: Mapped[Optional[str]] = mapped_column(ForeignKey("people.id"), nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ActivityDeadline(Base):
    __tablename__ = "activity_deadlines"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    activity_id: Mapped[str] = mapped_column(ForeignKey("activities.id"), nullable=False)
    activity_stage_id: Mapped[str] = mapped_column(ForeignKey("activity_stages.id"), nullable=False)
    deadline_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ActivityCollaborator(Base):
    __tablename__ = "activity_collaborators"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    activity_id: Mapped[str] = mapped_column(ForeignKey("activities.id"), nullable=False)
    person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ActivityProject(Base):
    __tablename__ = "activity_projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    activity_id: Mapped[str] = mapped_column(ForeignKey("activities.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ActivityPublication(Base):
    __tablename__ = "activity_publications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    activity_id: Mapped[str] = mapped_column(ForeignKey("activities.id"), nullable=False)
    publication_id: Mapped[str] = mapped_column(ForeignKey("publications.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class MeetingType(Base):
    __tablename__ = "meeting_types"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    description_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MeetingPurpose(Base):
    __tablename__ = "meeting_purposes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    description_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    meeting_type_id: Mapped[str] = mapped_column(ForeignKey("meeting_types.id"), nullable=False)
    organizer_person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    meeting_date: Mapped[str] = mapped_column(String(50), nullable=False)
    start_time: Mapped[str] = mapped_column(String(50), nullable=False)
    end_time_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MeetingSlot(Base):
    __tablename__ = "meeting_slots"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    meeting_id: Mapped[str] = mapped_column(ForeignKey("meetings.id"), nullable=False)
    start_time: Mapped[str] = mapped_column(String(50), nullable=False)
    end_time: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="Open", nullable=False)
    taken_by_person_id_optional: Mapped[Optional[str]] = mapped_column(ForeignKey("people.id"), nullable=True)
    activity_id_optional: Mapped[Optional[str]] = mapped_column(ForeignKey("activities.id"), nullable=True)
    purpose_id_optional: Mapped[Optional[str]] = mapped_column(ForeignKey("meeting_purposes.id"), nullable=True)
    description_optional: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confirmed_presented: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class MeetingSlotPresenter(Base):
    __tablename__ = "meeting_slot_presenters"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    meeting_slot_id: Mapped[str] = mapped_column(ForeignKey("meeting_slots.id"), nullable=False)
    person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class MasterThesis(Base):
    __tablename__ = "master_theses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    thesis_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    keywords: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    related_activity_optional: Mapped[Optional[str]] = mapped_column(ForeignKey("activities.id"), nullable=True)
    related_project_optional: Mapped[Optional[str]] = mapped_column(ForeignKey("projects.id"), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prerequisites: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Available", nullable=False)
    student_name_optional: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_by_person_id: Mapped[Optional[str]] = mapped_column(ForeignKey("people.id"), nullable=True)
    assigned_at_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    completed_at_optional: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class ThesisSupervisor(Base):
    __tablename__ = "thesis_supervisors"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    thesis_id: Mapped[str] = mapped_column(ForeignKey("master_theses.id"), nullable=False)
    person_id: Mapped[str] = mapped_column(ForeignKey("people.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)