# v1 Workflows

This document defines the main workflows for the first version of the research group management platform.

## 1. Access and Person Selection Workflow

1. User opens the app.
2. Cloudflare Access checks whether the user is allowed to enter.
3. User reaches the internal app.
4. User selects their profile from the people list.
5. App stores the selected profile in the session.
6. App logs the access event.

Log entry:
- selected_person
- access_time
- action = login/profile_selected

---

## 2. Project Creation Workflow

1. User opens the Projects tab.
2. User clicks Create Project.
3. User fills:
   - title
   - status: Applied / Granted / Rejected / Completed
   - description
   - people involved
   - funding body optional
   - start date optional
   - end date optional
4. App creates a project ID.
5. Project is saved.
6. Project appears in the project list.
7. App logs the creation.

---

## 3. Project Editing Workflow

1. User opens a project.
2. User edits allowed fields.
3. App saves changes.
4. Updated project appears in project detail page.
5. App logs:
   - edited_by
   - edited_at
   - changed_fields

---

## 4. Activity Creation Workflow

1. User opens the Activities tab.
2. User clicks Create Activity.
3. User fills:
   - title
   - field
   - related project or projects optional
   - main assignee
   - supervisor
   - collaborators
   - description
   - current stage
   - stage deadlines
4. App generates activity ID using field prefix and unique number.
   - example: HP-384
5. Activity is saved.
6. Activity appears in the activity list.
7. App logs the creation.

---

## 5. Activity Stage Update Workflow

1. Authorized user opens an activity.
2. User changes current stage.
3. App updates the active stage.
4. Deadlines before the current stage are shown as inactive/locked.
5. Deadlines from current stage onward remain active.
6. App saves the update.
7. App logs the change.

---

## 6. Activity and Publication Linking Workflow

1. Authorized user opens an activity or publication.
2. User selects linked publication or linked activity.
3. App saves the relation.
4. Both detail pages show the link.
5. Clicking the linked item opens its detail page.
6. App logs the linking action.

---

## 7. Publication Creation Workflow

1. User opens the Publications tab.
2. User clicks Create Publication.
3. User selects type:
   - Journal
   - Conference
4. User fills:
   - title
   - main author
   - supervisor
   - collaborators
   - connected activity optional
   - status
5. If Journal:
   - journal name is shown.
6. If Conference:
   - conference name
   - conference date
   - conference place
7. App generates publication ID:
   - J-0001 for journal
   - C-0001 for conference
8. Publication is saved.
9. App logs the creation.

---

## 8. Publication Status Update Workflow

1. Authorized user opens a publication.
2. User changes status.
3. Status belongs to one publication workflow:
   - before submission
   - after submission
4. App saves the new status.
5. Publication list updates.
6. App logs the change.

Suggested statuses:

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

## 9. Meeting Creation Workflow

1. User opens the Meetings tab.
2. User clicks Create Meeting.
3. User selects meeting type:
   - Organizational Meeting
   - Activity Meeting
   - PhD Meeting
4. User fills:
   - title
   - date
   - time
   - organizer
   - description optional
5. If Activity Meeting:
   - organizer creates one or more slots.
6. Meeting is saved.
7. App logs the creation.

---

## 10. Meeting Slot Take Workflow

1. User opens an activity meeting.
2. User sees open slots.
3. User selects an open slot.
4. User fills:
   - activity to present
   - presenters
   - main purpose
   - description
5. Slot status changes from Open to Taken.
6. Slot stores:
   - taken_by
   - activity_id
   - presenters
   - purpose
   - description
7. App logs the slot-taking action.

No request or organizer acceptance is required.

---

## 11. Meeting Slot Release Workflow

1. User opens a slot they have taken.
2. User clicks Release Slot.
3. Slot returns to Open.
4. Slot presentation details are cleared or archived in the log.
5. App logs the release action.

Allowed to release:
- person who took the slot
- meeting organizer
- admin

---

## 12. Meeting Confirmation Workflow

1. After the meeting, organizer opens the meeting page.
2. Organizer reviews taken slots.
3. Organizer confirms whether each activity was presented.
4. If confirmed:
   - slot status becomes Completed
   - linked activity last_presented_at becomes meeting date
5. If not confirmed:
   - slot can remain Taken or be marked Not Presented
6. App logs the confirmation.

---

## 13. Master Thesis Creation Workflow

1. User opens the Master Theses tab.
2. User clicks Create Thesis Idea.
3. User fills:
   - title
   - keywords
   - related activity optional
   - related project optional
   - description
   - prerequisites
4. App generates thesis ID:
   - MT-0001
5. Thesis status becomes Available.
6. Thesis appears in the thesis bank.
7. App logs the creation.

---

## 14. Master Thesis Assignment Workflow

1. User opens an available thesis idea.
2. User clicks Assign Thesis.
3. User fills:
   - student name
   - supervisor or supervisors
4. Thesis status changes to Assigned.
5. Assigned information is shown in the thesis detail page.
6. App logs the assignment.

---

## 15. Master Thesis Completion Workflow

1. Authorized user opens an assigned thesis.
2. User marks thesis as Completed.
3. Completion date is saved.
4. Thesis remains visible in the archive/completed list.
5. App logs the completion.

---

## 16. Archive and Soft Delete Workflow

1. Authorized user opens an item.
2. User clicks Archive or Delete.
3. App does not permanently remove the item.
4. Item is marked as archived/deleted.
5. Item disappears from normal views.
6. Admin can restore it.
7. App logs the action.

This applies to:
- projects
- activities
- publications
- meetings
- master theses

---

## 17. Logging Workflow

For important actions, the app creates a log entry.

Logged actions:
- profile selected
- created item
- edited item
- archived item
- restored item
- deleted item
- linked item
- unlinked item
- took meeting slot
- released meeting slot
- confirmed presentation
- changed status
- changed stage

Each log entry stores:
- log_id
- actor_person_id
- action
- entity_type
- entity_id
- timestamp
- summary
- changed_fields optional

---

## 18. Permission Check Workflow

1. User attempts an action.
2. Backend checks selected profile and role.
3. Backend checks whether the person is linked to the item.
4. If allowed:
   - action continues.
5. If not allowed:
   - app shows access denied.
6. Denied action is optionally logged.

Basic permission logic:
- Admin can edit everything.
- Project involved people can edit project details.
- Activity main assignee, supervisor, collaborators, and admin can edit activity.
- Publication main author, supervisor, collaborators, and admin can edit publication.
- Meeting organizer and admin can edit meeting.
- Slot taker can release their own slot.
- Thesis creator, assigned supervisors, and admin can edit thesis.
- Everyone can view non-archived records.

---

## 19. Admin Settings Workflow

1. Admin opens Admin Settings.
2. Admin can manage:
   - people
   - roles
   - research fields
   - field prefixes
   - activity stages
   - publication statuses
3. App saves changes.
4. These settings affect future records.
5. App logs admin changes.

---

## 20. Search and Filter Workflow

1. User opens any main tab.
2. User can search by title, ID, person, status, stage, field, or keyword.
3. User can filter records.
4. App returns matching records.
5. No log is needed for normal search.
