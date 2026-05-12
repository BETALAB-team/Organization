# Research Group Management Platform — V1 Entities

## Scope

V1 includes only the following modules:

1. People
2. Projects
3. Activities
4. Publications
5. Meetings
6. Meeting Slots
7. Master Theses
8. Admin Settings
9. Logs

Excluded from V1:

- Calendar synchronization
- Chat/messaging
- File uploads
- Email notifications
- AI features
- Mobile app wrapper
- Advanced dashboards

---

# 1. People

## Purpose
Represents members of the research group. People are selected after entering the shared access system and are used for assignments, permissions, logs, and responsibilities.

## Fields

- `person_id`
- `full_name`
- `email`
- `role`
- `position_title`
- `is_active`
- `created_at`
- `updated_at`

## Role Options

- Administrator
- Supervisor
- Senior Researcher
- Postdoctoral Researcher
- Research Assistant
- PhD Student
- Guest / External Collaborator

## Relationships

- One person can be involved in many projects.
- One person can be assigned to many activities.
- One person can supervise many activities.
- One person can author many publications.
- One person can organize meetings.
- One person can take meeting slots.
- One person can supervise master theses.

## Who can create

- Administrator

## Who can edit

- Administrator
- The person themselves, for limited profile fields if enabled later

## Who can view

- Everyone with access to the platform

---

# 2. Projects

## Purpose
Represents a high-level research or funding container. Projects sit above activities. A project can contain many activities, and an activity can be linked to one or more projects.

## Fields

- `project_id`
- `project_code`
- `title`
- `status`
- `description`
- `funding_body`
- `people_involved`
- `start_date`
- `end_date`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

## Status Options

- Applied
- Granted
- Rejected
- Completed
- Archived

## Relationships

- One project can link to many activities.
- One activity can link to many projects.
- One project can link indirectly to publications through activities.
- One project can link indirectly to master theses through activities.

## Who can create

- Administrator
- Supervisor
- Senior Researcher
- Postdoctoral Researcher

## Who can edit

- Administrator
- People involved in the project

## Who can view

- Everyone with access to the platform

---

# 3. Activities

## Purpose
Represents the main operational research work unit. Activities track research work, responsibilities, stages, deadlines, linked projects, linked publications, and meeting presentations.

## Fields

- `activity_id`
- `activity_code`
- `title`
- `field_id`
- `description`
- `main_assignee`
- `supervisor`
- `collaborators`
- `current_stage`
- `last_presented_at`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

## ID Rule

Activity IDs should be generated using:

`FIELDPREFIX-XYZ`

Example:

- `HP-384`
- `UBEM-127`
- `PV-942`

Where:

- `FIELDPREFIX` is configured by the administrator.
- `XYZ` is a random three-digit number unique among existing activities with the same or global ID space.

## Relationships

- One activity can link to one or more projects.
- One activity can link to many publications.
- One activity can be presented in many meeting slots.
- One activity can link to many master thesis ideas.
- One activity has many stage deadlines.

## Who can create

- Everyone with access to the platform

## Who can edit

- Administrator
- Main assignee
- Supervisor
- Collaborators

## Who can view

- Everyone with access to the platform

---

# 4. Activity Deadlines

## Purpose
Stores deadlines for each stage of an activity.

## Fields

- `deadline_id`
- `activity_id`
- `stage_id`
- `deadline_date`
- `is_active`
- `created_at`
- `updated_at`

## Behavior

- Deadlines before the current activity stage should be shown as inactive or grayed out.
- Deadlines for the current stage and later stages should be active.

## Relationships

- One activity has many activity deadlines.
- Each deadline belongs to one stage.

## Who can create

- Automatically when activity is created
- Administrator
- Activity editors

## Who can edit

- Administrator
- Activity editors

## Who can view

- Everyone with access to the platform

---

# 5. Publications

## Purpose
Represents journal articles and conference articles connected to activities.

## Fields

- `publication_id`
- `publication_code`
- `type`
- `title`
- `main_author`
- `supervisor`
- `collaborators`
- `connected_activity_id`
- `status_phase`
- `status_step`
- `journal_title`
- `conference_name`
- `conference_date`
- `conference_place`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

## Type Options

- Journal Article
- Conference Article

## ID Rule

Publication IDs should be generated using:

- `J-0001` for journal articles
- `C-0001` for conference articles

The number must be unique.

## Status Structure

### Before Submission

- Writing Manuscript
- Internal Review
- Ready for Submission
- Submitted

### After Submission

- Under Review
- Revision / Resubmission
- Accepted
- Published

## Conditional Fields

If type is `Journal Article`:

- `journal_title` is required.

If type is `Conference Article`:

- `conference_name` is required.
- `conference_date` is required.
- `conference_place` is required.

## Relationships

- One publication can link to one activity.
- One activity can have many publications.
- Publication people are connected through main author, supervisor, and collaborators.

## Who can create

- Everyone with access to the platform

## Who can edit

- Administrator
- Main author
- Supervisor
- Collaborators

## Who can view

- Everyone with access to the platform

---

# 6. Meetings

## Purpose
Represents meetings in the research group. Meetings can be organizational meetings, activity meetings, or PhD meetings.

## Fields

- `meeting_id`
- `title`
- `meeting_type`
- `organizer`
- `date`
- `start_time`
- `end_time`
- `description`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

## Meeting Type Options

- Organizational Meeting
- Activity Meeting
- PhD Meeting

## Relationships

- One meeting can have many meeting slots.
- One organizer can organize many meetings.

## Who can create

- Administrator
- Supervisor
- Senior Researcher
- Postdoctoral Researcher

## Who can edit

- Administrator
- Meeting organizer

## Who can view

- Everyone with access to the platform

---

# 7. Meeting Slots

## Purpose
Represents open or taken presentation slots inside a meeting. Slots do not require approval. If a slot is open, an eligible person can take it. If they took it, they can release it.

## Fields

- `slot_id`
- `meeting_id`
- `slot_start_time`
- `slot_end_time`
- `status`
- `taken_by`
- `activity_id`
- `presenters`
- `main_purpose`
- `description`
- `confirmed_presented`
- `confirmed_by`
- `confirmed_at`
- `created_at`
- `updated_at`

## Status Options

- Open
- Taken
- Completed
- Cancelled

## Main Purpose Options

- Brainstorming
- Asking Questions
- Problem Debugging
- Progress Update
- Decision Needed
- Feedback Request
- Other

## Behavior

- If a slot is open, an eligible person can take it.
- When taking a slot, the person must select an activity.
- The activity list should show only activities where the person is the main assignee.
- Presenters can include multiple people involved in the activity.
- The person who took the slot can release it.
- The organizer or administrator can release any slot.
- After the meeting, the organizer can confirm that the activity was presented.
- When confirmed, the linked activity `last_presented_at` becomes the meeting date.

## Relationships

- One meeting slot belongs to one meeting.
- One meeting slot can link to one activity.
- One activity can be presented in many slots over time.

## Who can create

- Administrator
- Meeting organizer

## Who can take an open slot

- Main assignee of at least one activity

## Who can edit/release

- Administrator
- Meeting organizer
- Person who took the slot

## Who can confirm presentation

- Administrator
- Meeting organizer

## Who can view

- Everyone with access to the platform

---

# 8. Master Theses

## Purpose
Represents master thesis ideas and assigned thesis topics. New thesis ideas go into a thesis bank. Available thesis ideas can later be assigned to a student and one or more supervisors.

## Fields

- `thesis_id`
- `thesis_code`
- `title`
- `keywords`
- `related_activity_id`
- `related_project_id`
- `description`
- `prerequisites`
- `status`
- `student_name`
- `supervisors`
- `assigned_by`
- `assigned_at`
- `created_by`
- `created_at`
- `updated_at`
- `archived_at`

## ID Rule

Master thesis IDs should be generated using:

`MT-0001`

Example:

- `MT-0001`
- `MT-0002`
- `MT-0003`

## Status Options

- Available
- Assigned
- Completed
- Archived

## Behavior

- A person creates a thesis idea.
- The idea enters the thesis bank with status `Available`.
- Anyone with permission can assign the thesis by adding:
  - student name
  - one or more supervisors
- Once assigned, status becomes `Assigned`.
- Completed theses can be marked as `Completed`.
- Old or irrelevant ideas can be archived.

## Relationships

- One thesis can optionally link to one activity.
- One thesis can optionally link to one project.
- One activity can link to many thesis ideas.
- One project can link to many thesis ideas.
- One thesis can have multiple supervisors.

## Who can create

- Everyone with access to the platform

## Who can assign

- Administrator
- Supervisor
- Senior Researcher
- Postdoctoral Researcher

## Who can edit

- Administrator
- Creator while thesis is available
- Assigned supervisors once thesis is assigned

## Who can view

- Everyone with access to the platform

---

# 9. Fields

## Purpose
Defines configurable research fields used to classify activities and generate activity IDs.

## Fields

- `field_id`
- `field_name`
- `field_prefix`
- `description`
- `is_active`
- `created_at`
- `updated_at`

## Examples

- Heat Pumps → `HP`
- Urban Building Energy Modeling → `UBEM`
- Photovoltaics → `PV`
- District Heating Networks → `DHN`

## Relationships

- One field can be assigned to many activities.

## Who can create

- Administrator

## Who can edit

- Administrator

## Who can view

- Everyone with access to the platform

---

# 10. Stages

## Purpose
Defines configurable activity stages.

## Fields

- `stage_id`
- `stage_name`
- `stage_order`
- `description`
- `is_active`
- `created_at`
- `updated_at`

## Suggested Default Stages

1. Exploratory Phase
2. Literature Review
3. Methodology Design
4. Data Collection / Preparation
5. Analysis / Modeling
6. Results
7. Writing
8. Internal Review
9. Submitted / Presented
10. Finalized with Publication

## Relationships

- One stage can be used by many activities.
- One stage can be used by many activity deadlines.

## Who can create

- Administrator

## Who can edit

- Administrator

## Who can view

- Everyone with access to the platform

---

# 11. Admin Settings

## Purpose
Stores configurable platform settings.

## Fields

- `setting_id`
- `setting_key`
- `setting_value`
- `description`
- `updated_by`
- `updated_at`

## Example Settings

- shared access password hash
- allowed email domains if Cloudflare Access is used
- activity ID behavior
- publication ID behavior
- thesis ID behavior
- default stages
- active roles
- active fields

## Who can create

- Administrator

## Who can edit

- Administrator

## Who can view

- Administrator

---

# 12. Logs

## Purpose
Tracks important actions for accountability, debugging, and recovery.

## Fields

- `log_id`
- `actor_person_id`
- `action_type`
- `entity_type`
- `entity_id`
- `description`
- `old_value`
- `new_value`
- `created_at`
- `ip_address`
- `user_agent`

## Action Type Examples

- Login
- Logout
- Create
- Edit
- Archive
- Restore
- Delete Attempt
- Slot Taken
- Slot Released
- Presentation Confirmed
- Thesis Assigned
- Status Changed

## Behavior

- Every important action should create a log entry.
- Logs should not be editable by normal users.
- Deletion should be soft deletion wherever possible.

## Who can create

- Automatically by the system

## Who can edit

- Nobody in normal use

## Who can view

- Administrator
- Optional: limited logs visible inside each entity page, such as “last edited by X at Y”

---

# Relationship Summary

## Main hierarchy

```text
Projects
  ↓
Activities
  ↓
Publications / Meetings / Master Theses
```

## Core relationships

- One project can have many activities.
- One activity can link to many projects.
- One activity can have many publications.
- One publication links to one activity.
- One activity can be presented in many meeting slots.
- One meeting can have many meeting slots.
- One thesis can link to one activity and/or one project.
- One person can participate in many entities.

---

# V1 Safety Rules

1. Use soft delete instead of permanent delete.
2. Show `last edited by` and `last edited at` on major records.
3. Keep a log of key actions.
4. Allow administrator restore for archived records.
5. Avoid file uploads in V1.
6. Avoid complex authentication in V1 if Cloudflare Access is used.
7. Keep forms simple and faster than Excel.

---

# V1 Priority Order

1. People
2. Projects
3. Activities
4. Publications
5. Meetings and Meeting Slots
6. Master Theses
7. Logs
8. Admin Settings
9. Deployment
10. Internal beta testing

