# v1 Permissions

This document defines the permission rules for the first version of the research group management platform.

The app uses a lightweight internal access model:

- Cloudflare Access protects the app from the outside.
- Inside the app, users select their profile.
- The selected profile controls permissions.
- All important actions are logged.

This is suitable for a trusted internal research group.

---

## 1. Roles

Main roles:

- Admin
- Supervisor
- Senior Researcher
- Postdoc Researcher
- Research Assistant

Optional future roles:

- Guest
- Student
- External Collaborator

---

## 2. General Permission Principles

1. Everyone can view non-archived records.
2. Admin can create, edit, archive, restore, and configure everything.
3. People linked to an item can usually edit that item.
4. People not linked to an item can view it but cannot edit it.
5. Delete should be soft delete only.
6. All create, edit, archive, restore, and delete actions must be logged.
7. Search and view actions do not need to be logged.
8. Permission checks must happen in the backend, not only in the frontend.

---

## 3. People Permissions

### Everyone can:
- View people list
- View basic profile information

### Admin can:
- Create people
- Edit people
- Archive people
- Assign roles
- Change profile visibility
- Restore archived people

### Non-admin users cannot:
- Create new people
- Change another person's role
- Archive people

---

## 4. Project Permissions

A project is a high-level research or funding container.

### Everyone can:
- View projects
- Search projects
- Open project detail pages

### Admin can:
- Create projects
- Edit all projects
- Archive projects
- Restore projects
- Link and unlink activities

### People involved in a project can:
- Edit project title
- Edit project description
- Edit project status
- Edit people involved
- Link and unlink activities

### People not involved in a project cannot:
- Edit project details
- Archive the project
- Restore the project

### Project status options:
- Applied
- Granted
- Rejected
- Completed
- Archived

---

## 5. Activity Permissions

An activity is a concrete research work item.

Linked people:
- main assignee
- supervisor
- collaborators

### Everyone can:
- View activities
- Search activities
- Open activity detail pages
- View linked projects
- View linked publications
- View last presented date

### Admin can:
- Create activities
- Edit all activities
- Archive activities
- Restore activities
- Link and unlink projects
- Link and unlink publications
- Change stage
- Edit deadlines

### Main assignee can:
- Edit activity details
- Change current stage
- Edit stage deadlines
- Link and unlink publications
- Link and unlink projects
- Add or remove collaborators

### Supervisor can:
- Edit activity details
- Change current stage
- Edit stage deadlines
- Link and unlink publications
- Link and unlink projects
- Add or remove collaborators

### Collaborators can:
- Edit description
- Edit notes optional
- Link publications optional
- Take meeting slots for this activity if allowed by activity rules

### People not linked to the activity cannot:
- Edit the activity
- Change stage
- Edit deadlines
- Link publications
- Archive the activity

### Activity ID generation:
- Field prefix plus unique number
- Example: HP-384
- Admin controls field prefixes
- Backend must guarantee uniqueness

---

## 6. Activity Stage Deadline Permissions

### Everyone can:
- View all stage deadlines

### Admin, main assignee, and supervisor can:
- Edit deadlines
- Change stage

### Collaborators can:
- View deadlines
- Suggest changes only if future feature is added

### Deadline display rule:
- Stages before current stage are inactive or grayed out
- Current and future stages remain active

---

## 7. Publication Permissions

Linked people:
- main author
- supervisor
- collaborators

### Everyone can:
- View publications
- Search publications
- Open publication detail pages
- View linked activity

### Admin can:
- Create publications
- Edit all publications
- Archive publications
- Restore publications
- Link and unlink activities
- Change publication status
- Change publication type

### Main author can:
- Edit publication details
- Change status
- Link and unlink activity
- Edit journal or conference metadata
- Add or remove collaborators

### Supervisor can:
- Edit publication details
- Change status
- Link and unlink activity
- Edit journal or conference metadata
- Add or remove collaborators

### Collaborators can:
- Edit description or notes optional
- View status
- View linked activity

### People not linked to the publication cannot:
- Edit publication
- Change status
- Link or unlink activity
- Archive publication

### Publication ID generation:
- Journal: J-0001
- Conference: C-0001
- Backend must guarantee uniqueness

---

## 8. Meeting Permissions

Meeting types:
- Organizational Meeting
- Activity Meeting
- PhD Meeting

### Everyone can:
- View meetings
- View meeting slots
- Search meetings

### Admin can:
- Create meetings
- Edit all meetings
- Archive meetings
- Restore meetings
- Create, edit, and remove slots
- Confirm presentations

### Meeting organizer can:
- Edit their meeting
- Create slots
- Edit slots
- Remove open slots
- Confirm presentations
- Release taken slots if needed

### Non-organizer users can:
- View meetings
- Take open slots if eligible
- Release their own taken slot

### Non-organizer users cannot:
- Edit meeting details
- Delete slots created by organizer
- Confirm presentations unless allowed later

---

## 9. Meeting Slot Permissions

Slot statuses:
- Open
- Taken
- Completed
- Not Presented
- Cancelled

### Everyone can:
- View open and taken slots

### Eligible users can take a slot if:
- Slot is open
- Meeting type is Activity Meeting
- User is linked to the activity being presented, preferably as main assignee or collaborator

### Slot taker can:
- Edit presentation details while slot is taken
- Release their own slot before confirmation

### Organizer can:
- Create slots
- Edit slots
- Release any slot in their meeting
- Confirm whether presentation happened
- Mark slot as completed or not presented

### Admin can:
- Do everything

### After confirmation:
- Completed slots should not be editable except by organizer or admin
- If completed, linked activity last_presented_at is updated to meeting date

---

## 10. Master Thesis Permissions

Thesis statuses:
- Available
- Assigned
- Completed
- Archived

Linked people:
- creator
- assigned supervisor or supervisors

### Everyone can:
- View thesis bank
- Search thesis ideas
- View thesis details
- See whether thesis is available or assigned

### Admin can:
- Create thesis ideas
- Edit all thesis ideas
- Assign theses
- Archive theses
- Restore theses
- Mark theses as completed

### Thesis creator can:
- Edit thesis idea while available
- Edit title
- Edit keywords
- Edit related activity/project
- Edit description
- Edit prerequisites

### Assigned supervisors can:
- Edit assigned thesis details
- Mark thesis as completed
- Update student name if needed

### Any user can assign an available thesis if they provide:
- student name
- at least one supervisor

### People not linked to assigned thesis cannot:
- Edit assigned thesis
- Mark it completed
- Archive it

---

## 11. Admin Settings Permissions

Admin settings include:

- people
- roles
- research fields
- field prefixes
- activity stages
- publication statuses
- meeting purposes
- thesis statuses

### Admin can:
- View admin settings
- Create settings
- Edit settings
- Archive settings
- Restore settings

### Non-admin users cannot:
- Access admin settings
- Change field prefixes
- Change global stages
- Change role definitions

---

## 12. Log Permissions

### Admin can:
- View all logs
- Filter logs
- Export logs optional

### Normal users can:
- View limited logs related to records they can access optional
- View last edited by and last edited at

### Logs should record:
- actor person
- action
- entity type
- entity ID
- timestamp
- summary
- changed fields optional

### Logs should not be editable by normal users.

---

## 13. Archive and Restore Permissions

### Admin can:
- Archive any record
- Restore any archived record

### Linked responsible people can archive:
- Their own projects if involved
- Their own activities if main assignee or supervisor
- Their own publications if main author or supervisor
- Their own thesis ideas if creator and still available

### Normal users cannot:
- Permanently delete records

### Permanent deletion:
- Should be avoided in v1
- Can be added later only for admin if necessary

---

## 14. Dashboard Permissions

### Everyone can see:
- Their linked activities
- Their linked publications
- Their thesis items
- Upcoming meetings
- Available meeting slots
- Available thesis ideas
- Recently updated records

### Admin can also see:
- System-wide overview
- Recent logs
- Archived records
- Admin alerts optional

---

## 15. Permission Matrix Summary

| Entity | Everyone View | Linked People Edit | Organizer Edit | Admin Full Control |
|---|---:|---:|---:|---:|
| People | Yes | Own profile only optional | No | Yes |
| Projects | Yes | Yes | No | Yes |
| Activities | Yes | Yes | No | Yes |
| Publications | Yes | Yes | No | Yes |
| Meetings | Yes | No | Yes | Yes |
| Meeting Slots | Yes | Slot taker can edit/release | Yes | Yes |
| Master Theses | Yes | Yes | No | Yes |
| Admin Settings | No | No | No | Yes |
| Logs | Limited | Limited | Limited | Yes |

---

## 16. Backend Enforcement Rule

The frontend may hide buttons, but the backend must still check permissions before every important action.

Important protected actions:
- create
- update
- archive
- restore
- link
- unlink
- take slot
- release slot
- confirm meeting presentation
- update stage
- update status
- change admin settings

If permission fails:
- return access denied
- do not change data
- optionally log denied attempt

---

## 17. v1 Simplification

For v1, keep permissions simple.

Do not build:
- complex ownership transfer
- temporary permissions
- private records
- record-level visibility toggles
- external guest access
- student login

Add those later only if truly needed.
