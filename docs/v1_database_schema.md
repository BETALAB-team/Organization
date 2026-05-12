# v1 Database Schema

This document defines the database schema for the first version of the research group management platform.

The schema is designed for:
- clarity
- extensibility
- simple internal workflows
- lightweight deployment

The database system is expected to be PostgreSQL.

---

# 1. Core Principles

1. Every main entity has:
   - id
   - created_at
   - updated_at
   - archived flag optional

2. Relationships should be normalized.

3. Many-to-many relationships should use relationship tables.

4. Permission checks happen in the backend.

5. IDs shown to users are separate from internal database IDs.

Example:
- internal id = UUID or integer
- visible activity code = HP-384

6. Soft delete is preferred over permanent delete.

---

# 2. Main Tables

Main system entities:

- people
- roles
- projects
- activities
- publications
- meetings
- meeting_slots
- master_theses
- logs

Admin/configuration entities:

- research_fields
- activity_stages
- publication_statuses
- meeting_types
- meeting_purposes

Relationship tables:

- project_people
- project_activities
- activity_collaborators
- activity_projects
- activity_publications
- publication_collaborators
- meeting_slot_presenters
- thesis_supervisors

Deadline tables:

- activity_deadlines
- publication_deadlines

---

# 3. Table Definitions

---

## roles

Purpose:
Stores role definitions.

Columns:
- id
- name
- description
- created_at
- updated_at

Examples:
- Admin
- Supervisor
- Senior Researcher
- Postdoc Researcher
- Research Assistant

---

## people

Purpose:
Stores selectable user profiles.

Columns:
- id
- full_name
- role_id
- email_optional
- is_active
- created_at
- updated_at
- archived

Relationships:
- many people belong to one role
- people can belong to many projects
- people can collaborate on many activities
- people can collaborate on many publications

---

## research_fields

Purpose:
Defines research fields and activity prefixes.

Columns:
- id
- name
- prefix
- description_optional
- created_at
- updated_at

Examples:
- Heat Pumps → HP
- GIS → GIS
- Photovoltaics → PV

---

## projects

Purpose:
High-level research or funding containers.

Columns:
- id
- project_code_optional
- title
- status
- description
- funding_body_optional
- start_date_optional
- end_date_optional
- created_by_person_id
- created_at
- updated_at
- archived

Project status examples:
- Applied
- Granted
- Rejected
- Completed

Relationships:
- projects can have many people
- projects can link to many activities

---

## project_people

Purpose:
Many-to-many relation between projects and people.

Columns:
- id
- project_id
- person_id
- involvement_role_optional
- created_at

Examples:
- PI
- Researcher
- Collaborator

---

## activities

Purpose:
Stores research activities.

Columns:
- id
- activity_code
- title
- field_id
- description
- current_stage_id
- main_assignee_person_id
- supervisor_person_id
- last_presented_at_optional
- created_by_person_id
- created_at
- updated_at
- archived

Relationships:
- activity belongs to one research field
- activity has one current stage
- activity can have many collaborators
- activity can link to many projects
- activity can link to many publications

Visible ID example:
- HP-384

---

## activity_collaborators

Purpose:
Stores activity collaborators.

Columns:
- id
- activity_id
- person_id
- created_at

---

## activity_projects

Purpose:
Links activities and projects.

Columns:
- id
- activity_id
- project_id
- created_at

---

## activity_publications

Purpose:
Links activities and publications.

Columns:
- id
- activity_id
- publication_id
- created_at

---

## activity_stages

Purpose:
Stores allowed activity stages.

Columns:
- id
- name
- ordering
- description_optional
- created_at
- updated_at

Example stages:
- Exploratory
- Literature Review
- Data Collection
- Modeling
- Writing
- Submitted
- Published

---

## activity_deadlines

Purpose:
Stores deadlines for activity stages.

Columns:
- id
- activity_id
- activity_stage_id
- deadline_optional
- created_at
- updated_at

Logic:
- stages before current stage appear inactive
- current and future stages remain active

---

## publications

Purpose:
Stores publications.

Columns:
- id
- publication_code
- type
- title
- current_status_id
- main_author_person_id
- supervisor_person_id
- connected_activity_optional
- journal_name_optional
- conference_name_optional
- conference_date_optional
- conference_place_optional
- description_optional
- created_by_person_id
- created_at
- updated_at
- archived

Publication types:
- Journal
- Conference

Visible ID examples:
- J-0001
- C-0001

Relationships:
- publication has one current status
- publication can have many collaborators
- publication can link to many activities

---

## publication_collaborators

Purpose:
Stores publication collaborators.

Columns:
- id
- publication_id
- person_id
- created_at

---

## publication_statuses

Purpose:
Stores allowed publication workflow statuses.

Columns:
- id
- name
- ordering
- workflow_group
- created_at
- updated_at

Workflow groups:
- before_submission
- after_submission

Example statuses:

Before submission:
- Writing Manuscript
- Internal Review
- Ready for Submission
- Submitted

After submission:
- Under Review
- Revision
- Resubmitted
- Accepted
- Published

---

## publication_deadlines

Purpose:
Stores deadlines for publication statuses.

Columns:
- id
- publication_id
- publication_status_id
- deadline_optional
- created_at
- updated_at

Logic:
- statuses before current status appear inactive
- current and future statuses remain active

---

## meetings

Purpose:
Stores meetings.

Columns:
- id
- title
- meeting_type_id
- organizer_person_id
- meeting_date
- start_time
- end_time_optional
- description_optional
- created_at
- updated_at
- archived

Meeting types:
- Organizational Meeting
- Activity Meeting
- PhD Meeting

Relationships:
- meeting can have many slots

---

## meeting_types

Purpose:
Stores meeting type definitions.

Columns:
- id
- name
- description_optional
- created_at
- updated_at

---

## meeting_purposes

Purpose:
Stores allowed presentation purposes.

Columns:
- id
- name
- description_optional
- created_at
- updated_at

Examples:
- Brainstorm
- Problem Debug
- Progress Update
- Discussion
- Question Session

---

## meeting_slots

Purpose:
Stores slots inside meetings.

Columns:
- id
- meeting_id
- start_time
- end_time
- status
- taken_by_person_id_optional
- activity_id_optional
- purpose_id_optional
- description_optional
- confirmed_presented
- created_at
- updated_at

Slot status examples:
- Open
- Taken
- Completed
- Not Presented
- Cancelled

Logic:
- users can take open slots
- users can release their own slots
- organizer confirms presentations
- confirmed presentations update activity last_presented_at

---

## meeting_slot_presenters

Purpose:
Stores presenters linked to a slot.

Columns:
- id
- meeting_slot_id
- person_id
- created_at

Allows multiple presenters for one slot.

---

## master_theses

Purpose:
Stores thesis ideas and assigned theses.

Columns:
- id
- thesis_code
- title
- keywords
- related_activity_optional
- related_project_optional
- description
- prerequisites
- status
- student_name_optional
- created_by_person_id
- assigned_at_optional
- completed_at_optional
- created_at
- updated_at
- archived

Visible ID example:
- MT-0001

Status examples:
- Available
- Assigned
- Completed
- Archived

Relationships:
- thesis can have multiple supervisors

---

## thesis_supervisors

Purpose:
Stores thesis supervisors.

Columns:
- id
- thesis_id
- person_id
- created_at

---

## logs

Purpose:
Stores important actions and audit history.

Columns:
- id
- actor_person_id
- action
- entity_type
- entity_id
- summary
- changed_fields_optional
- timestamp

Examples:
- created activity
- updated publication
- archived thesis
- took meeting slot
- released meeting slot
- confirmed presentation

Logs should not be editable by normal users.

---

# 4. Relationship Summary

One role:
- has many people

One project:
- has many people
- has many activities

One activity:
- belongs to one field
- has one main assignee
- has one supervisor
- has many collaborators
- has many deadlines
- has many linked projects
- has many linked publications

One publication:
- has one main author
- has one supervisor
- has many collaborators
- has many deadlines
- can link to many activities

One meeting:
- has many slots

One meeting slot:
- belongs to one meeting
- can have many presenters
- can optionally link to one activity

One thesis:
- can have many supervisors

---

# 5. Suggested ID Strategy

Internal database IDs:
- UUID recommended
or
- auto-increment integers

Visible user-facing IDs:
- generated separately

Examples:
- HP-384
- J-0001
- C-0004
- MT-0012

The backend must guarantee uniqueness.

---

# 6. Suggested Future Tables

Not required for v1:

- notifications
- comments
- file_uploads
- tags
- calendar_sync
- AI_summaries
- email_history
- attachments

Do not implement these in v1 unless truly necessary.

---

# 7. v1 Simplicity Rule

The schema should prioritize:
- clarity
- maintainability
- understandable relationships

Do not over-engineer the database for future hypothetical scaling.

The expected scale is small:
- around 15 users
- lightweight text-based records
- low traffic
- internal academic use
