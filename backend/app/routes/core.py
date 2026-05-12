from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.core import Log, Person, Project, Role
from app.models.core import (
    Activity,
    ActivityCollaborator,
    ActivityDeadline,
    ActivityProject,
    ActivityPublication,
    ActivityStage,
    Log,
    Person,
    Project,
    MasterThesis,
    ThesisSupervisor,
    Meeting,
    MeetingPurpose,
    MeetingSlot,
    MeetingSlotPresenter,
    MeetingType,
    Publication,
    PublicationCollaborator,
    PublicationDeadline,
    PublicationStatus,
    ResearchField,
    Role,
)
from app.schemas.core import (
    ActivityCreate,
    ActivityStageCreate,
    ActivityUpdate,
    MasterThesisAssign,
    MasterThesisComplete,
    MasterThesisCreate,
    MasterThesisUpdate,
    PersonCreate,
    PersonRead,
    ProjectCreate,
    ProjectRead,
    MeetingCreate,
    MeetingPurposeCreate,
    MeetingSlotCreate,
    MeetingSlotTake,
    MeetingTypeCreate,
    PublicationCreate,
    PublicationStatusCreate,
    PublicationUpdate,
    ResearchFieldCreate,
    RoleCreate,
    RoleRead,
)
from app.services.log_service import create_log

router = APIRouter()
def generate_activity_code(db: Session, field_id: str) -> str:
    field = db.query(ResearchField).filter(ResearchField.id == field_id).first()

    if field is None:
        raise HTTPException(status_code=404, detail="Research field not found")

    existing_count = (
        db.query(Activity)
        .filter(Activity.activity_code.like(f"{field.prefix}-%"))
        .count()
    )

    number = existing_count + 1

    while True:
        code = f"{field.prefix}-{number:03d}"
        existing = db.query(Activity).filter(Activity.activity_code == code).first()

        if existing is None:
            return code

        number += 1


def generate_publication_code(db: Session, publication_type: str) -> str:
    normalized_type = publication_type.lower().strip()

    if normalized_type == "journal":
        prefix = "J"
    elif normalized_type == "conference":
        prefix = "C"
    else:
        raise HTTPException(status_code=400, detail="Publication type must be Journal or Conference")

    existing_count = (
        db.query(Publication)
        .filter(Publication.publication_code.like(f"{prefix}-%"))
        .count()
    )

    number = existing_count + 1

    while True:
        code = f"{prefix}-{number:04d}"
        existing = db.query(Publication).filter(Publication.publication_code == code).first()

        if existing is None:
            return code

        number += 1


def activity_to_dict(db: Session, activity: Activity):
    field = db.query(ResearchField).filter(ResearchField.id == activity.field_id).first()
    stage = db.query(ActivityStage).filter(ActivityStage.id == activity.current_stage_id).first()
    main_assignee = db.query(Person).filter(Person.id == activity.main_assignee_person_id).first()
    supervisor = db.query(Person).filter(Person.id == activity.supervisor_person_id).first()

    collaborator_links = db.query(ActivityCollaborator).filter(
        ActivityCollaborator.activity_id == activity.id
    ).all()

    project_links = db.query(ActivityProject).filter(
        ActivityProject.activity_id == activity.id
    ).all()

    publication_links = db.query(ActivityPublication).filter(
        ActivityPublication.activity_id == activity.id
    ).all()

    deadline_rows = db.query(ActivityDeadline).filter(
        ActivityDeadline.activity_id == activity.id
    ).all()

    collaborators = []
    for link in collaborator_links:
        person = db.query(Person).filter(Person.id == link.person_id).first()
        if person is not None:
            collaborators.append({"id": person.id, "full_name": person.full_name})

    projects = []
    for link in project_links:
        project = db.query(Project).filter(Project.id == link.project_id).first()
        if project is not None:
            projects.append({"id": project.id, "title": project.title})

    publications = []
    for link in publication_links:
        publication = db.query(Publication).filter(Publication.id == link.publication_id).first()
        if publication is not None:
            publications.append(
                {
                    "id": publication.id,
                    "publication_code": publication.publication_code,
                    "title": publication.title,
                    "type": publication.type,
                }
            )

    deadlines = []
    for deadline in deadline_rows:
        deadline_stage = db.query(ActivityStage).filter(
            ActivityStage.id == deadline.activity_stage_id
        ).first()

        deadlines.append(
            {
                "id": deadline.id,
                "activity_stage_id": deadline.activity_stage_id,
                "stage_name": deadline_stage.name if deadline_stage else None,
                "stage_ordering": deadline_stage.ordering if deadline_stage else None,
                "deadline_optional": deadline.deadline_optional,
            }
        )

    return {
        "id": activity.id,
        "activity_code": activity.activity_code,
        "title": activity.title,
        "field_id": activity.field_id,
        "field_name": field.name if field else None,
        "description": activity.description,
        "current_stage_id": activity.current_stage_id,
        "current_stage_name": stage.name if stage else None,
        "main_assignee_person_id": activity.main_assignee_person_id,
        "main_assignee_name": main_assignee.full_name if main_assignee else None,
        "supervisor_person_id": activity.supervisor_person_id,
        "supervisor_name": supervisor.full_name if supervisor else None,
        "last_presented_at_optional": activity.last_presented_at_optional,
        "archived": activity.archived,
        "collaborators": collaborators,
        "projects": projects,
        "publications": publications,
        "deadlines": sorted(
            deadlines,
            key=lambda item: item["stage_ordering"] if item["stage_ordering"] is not None else 999,
        ),
    }


def publication_to_dict(db: Session, publication: Publication):
    status = db.query(PublicationStatus).filter(
        PublicationStatus.id == publication.current_status_id
    ).first()

    main_author = db.query(Person).filter(
        Person.id == publication.main_author_person_id
    ).first()

    supervisor = db.query(Person).filter(
        Person.id == publication.supervisor_person_id
    ).first()

    collaborator_links = db.query(PublicationCollaborator).filter(
        PublicationCollaborator.publication_id == publication.id
    ).all()

    deadline_rows = db.query(PublicationDeadline).filter(
        PublicationDeadline.publication_id == publication.id
    ).all()

    activity_links = db.query(ActivityPublication).filter(
        ActivityPublication.publication_id == publication.id
    ).all()

    collaborators = []
    for link in collaborator_links:
        person = db.query(Person).filter(Person.id == link.person_id).first()
        if person is not None:
            collaborators.append({"id": person.id, "full_name": person.full_name})

    deadlines = []
    for deadline in deadline_rows:
        deadline_status = db.query(PublicationStatus).filter(
            PublicationStatus.id == deadline.publication_status_id
        ).first()

        deadlines.append(
            {
                "id": deadline.id,
                "publication_status_id": deadline.publication_status_id,
                "status_name": deadline_status.name if deadline_status else None,
                "status_ordering": deadline_status.ordering if deadline_status else None,
                "deadline_optional": deadline.deadline_optional,
            }
        )

    activities = []
    for link in activity_links:
        activity = db.query(Activity).filter(Activity.id == link.activity_id).first()
        if activity is not None:
            activities.append(
                {
                    "id": activity.id,
                    "activity_code": activity.activity_code,
                    "title": activity.title,
                }
            )

    return {
        "id": publication.id,
        "publication_code": publication.publication_code,
        "type": publication.type,
        "title": publication.title,
        "current_status_id": publication.current_status_id,
        "current_status_name": status.name if status else None,
        "main_author_person_id": publication.main_author_person_id,
        "main_author_name": main_author.full_name if main_author else None,
        "supervisor_person_id": publication.supervisor_person_id,
        "supervisor_name": supervisor.full_name if supervisor else None,
        "journal_name_optional": publication.journal_name_optional,
        "conference_name_optional": publication.conference_name_optional,
        "conference_date_optional": publication.conference_date_optional,
        "conference_place_optional": publication.conference_place_optional,
        "description_optional": publication.description_optional,
        "archived": publication.archived,
        "collaborators": collaborators,
        "deadlines": sorted(
            deadlines,
            key=lambda item: item["status_ordering"] if item["status_ordering"] is not None else 999,
        ),
        "activities": activities,
    }
def meeting_to_dict(db: Session, meeting: Meeting):
    meeting_type = db.query(MeetingType).filter(MeetingType.id == meeting.meeting_type_id).first()
    organizer = db.query(Person).filter(Person.id == meeting.organizer_person_id).first()

    slots = db.query(MeetingSlot).filter(MeetingSlot.meeting_id == meeting.id).order_by(MeetingSlot.start_time).all()

    return {
        "id": meeting.id,
        "title": meeting.title,
        "meeting_type_id": meeting.meeting_type_id,
        "meeting_type_name": meeting_type.name if meeting_type else None,
        "organizer_person_id": meeting.organizer_person_id,
        "organizer_name": organizer.full_name if organizer else None,
        "meeting_date": meeting.meeting_date,
        "start_time": meeting.start_time,
        "end_time_optional": meeting.end_time_optional,
        "description_optional": meeting.description_optional,
        "archived": meeting.archived,
        "slots": [meeting_slot_to_dict(db, slot) for slot in slots],
    }


def meeting_slot_to_dict(db: Session, slot: MeetingSlot):
    taken_by = None
    if slot.taken_by_person_id_optional:
        taken_by = db.query(Person).filter(Person.id == slot.taken_by_person_id_optional).first()

    activity = None
    if slot.activity_id_optional:
        activity = db.query(Activity).filter(Activity.id == slot.activity_id_optional).first()

    purpose = None
    if slot.purpose_id_optional:
        purpose = db.query(MeetingPurpose).filter(MeetingPurpose.id == slot.purpose_id_optional).first()

    presenter_links = db.query(MeetingSlotPresenter).filter(
        MeetingSlotPresenter.meeting_slot_id == slot.id
    ).all()

    presenters = []
    for link in presenter_links:
        person = db.query(Person).filter(Person.id == link.person_id).first()
        if person is not None:
            presenters.append({"id": person.id, "full_name": person.full_name})

    return {
        "id": slot.id,
        "meeting_id": slot.meeting_id,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "status": slot.status,
        "taken_by_person_id_optional": slot.taken_by_person_id_optional,
        "taken_by_name": taken_by.full_name if taken_by else None,
        "activity_id_optional": slot.activity_id_optional,
        "activity_code": activity.activity_code if activity else None,
        "activity_title": activity.title if activity else None,
        "purpose_id_optional": slot.purpose_id_optional,
        "purpose_name": purpose.name if purpose else None,
        "description_optional": slot.description_optional,
        "confirmed_presented": slot.confirmed_presented,
        "presenters": presenters,
    }

def generate_thesis_code(db: Session) -> str:
    existing_count = db.query(MasterThesis).count()
    number = existing_count + 1

    while True:
        code = f"MT-{number:04d}"
        existing = db.query(MasterThesis).filter(MasterThesis.thesis_code == code).first()

        if existing is None:
            return code

        number += 1


def thesis_to_dict(db: Session, thesis: MasterThesis):
    creator = None
    if thesis.created_by_person_id:
        creator = db.query(Person).filter(Person.id == thesis.created_by_person_id).first()

    activity = None
    if thesis.related_activity_optional:
        activity = db.query(Activity).filter(Activity.id == thesis.related_activity_optional).first()

    project = None
    if thesis.related_project_optional:
        project = db.query(Project).filter(Project.id == thesis.related_project_optional).first()

    supervisor_links = db.query(ThesisSupervisor).filter(
        ThesisSupervisor.thesis_id == thesis.id
    ).all()

    supervisors = []
    for link in supervisor_links:
        person = db.query(Person).filter(Person.id == link.person_id).first()
        if person is not None:
            supervisors.append({"id": person.id, "full_name": person.full_name})

    return {
        "id": thesis.id,
        "thesis_code": thesis.thesis_code,
        "title": thesis.title,
        "keywords": thesis.keywords,
        "related_activity_optional": thesis.related_activity_optional,
        "related_activity_code": activity.activity_code if activity else None,
        "related_activity_title": activity.title if activity else None,
        "related_project_optional": thesis.related_project_optional,
        "related_project_title": project.title if project else None,
        "description": thesis.description,
        "prerequisites": thesis.prerequisites,
        "status": thesis.status,
        "student_name_optional": thesis.student_name_optional,
        "created_by_person_id": thesis.created_by_person_id,
        "created_by_name": creator.full_name if creator else None,
        "assigned_at_optional": thesis.assigned_at_optional,
        "completed_at_optional": thesis.completed_at_optional,
        "archived": thesis.archived,
        "supervisors": supervisors,
    }

@router.post("/roles", response_model=RoleRead)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    role = Role(
        name=payload.name,
        description=payload.description,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.get("/roles", response_model=list[RoleRead])
def list_roles(db: Session = Depends(get_db)):
    return (
        db.query(Role)
        .filter(Role.archived == False)
        .order_by(Role.name)
        .all()
    )


@router.post("/people", response_model=PersonRead)
def create_person(payload: PersonCreate, db: Session = Depends(get_db)):
    person = Person(
        full_name=payload.full_name,
        role_id=payload.role_id,
        email_optional=payload.email_optional,
    )
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.get("/people", response_model=list[PersonRead])
def list_people(db: Session = Depends(get_db)):
    return (
        db.query(Person)
        .filter(Person.archived == False)
        .filter(Person.is_active == True)
        .order_by(Person.full_name)
        .all()
    )


@router.post("/projects", response_model=ProjectRead)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        title=payload.title,
        status=payload.status,
        description=payload.description,
        funding_body_optional=payload.funding_body_optional,
        start_date_optional=payload.start_date_optional,
        end_date_optional=payload.end_date_optional,
        created_by_person_id=payload.created_by_person_id,
    )
    db.add(project)
    create_log(
        db=db,
        action="created",
        entity_type="project",
        entity_id=project.id,
        actor_person_id=payload.created_by_person_id,
        summary=f"Project created: {project.title}",
    )
    db.commit()
    db.refresh(project)
    return project


@router.get("/projects", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.archived == False).order_by(Project.created_at.desc()).all()

@router.get("/logs")
def list_logs(db: Session = Depends(get_db)):
    logs = db.query(Log).order_by(Log.timestamp.desc()).limit(100).all()

    return [
        {
            "id": log.id,
            "actor_person_id": log.actor_person_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "summary": log.summary,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]

@router.get("/projects/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return project


@router.put("/projects/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: ProjectCreate,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project.title = payload.title
    project.status = payload.status
    project.description = payload.description
    project.funding_body_optional = payload.funding_body_optional
    project.start_date_optional = payload.start_date_optional
    project.end_date_optional = payload.end_date_optional

    create_log(
        db=db,
        action="updated",
        entity_type="project",
        entity_id=project.id,
        actor_person_id=payload.created_by_person_id,
        summary=f"Project updated: {project.title}",
    )

    db.commit()
    db.refresh(project)

    return project


@router.patch("/projects/{project_id}/archive", response_model=ProjectRead)
def archive_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()

    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project.archived = True

    create_log(
        db=db,
        action="archived",
        entity_type="project",
        entity_id=project.id,
        summary=f"Project archived: {project.title}",
    )

    db.commit()
    db.refresh(project)

    return project

@router.post("/research-fields")
def create_research_field(payload: ResearchFieldCreate, db: Session = Depends(get_db)):
    field = ResearchField(
        name=payload.name,
        prefix=payload.prefix.upper(),
        description_optional=payload.description_optional,
    )

    db.add(field)
    db.commit()
    db.refresh(field)

    return field


@router.get("/research-fields")
def list_research_fields(db: Session = Depends(get_db)):
    return db.query(ResearchField).order_by(ResearchField.name).all()


@router.post("/activity-stages")
def create_activity_stage(payload: ActivityStageCreate, db: Session = Depends(get_db)):
    stage = ActivityStage(
        name=payload.name,
        ordering=payload.ordering,
        description_optional=payload.description_optional,
    )

    db.add(stage)
    db.commit()
    db.refresh(stage)

    return stage


@router.get("/activity-stages")
def list_activity_stages(db: Session = Depends(get_db)):
    return db.query(ActivityStage).order_by(ActivityStage.ordering).all()


@router.post("/publication-statuses")
def create_publication_status(payload: PublicationStatusCreate, db: Session = Depends(get_db)):
    status = PublicationStatus(
        name=payload.name,
        ordering=payload.ordering,
        workflow_group=payload.workflow_group,
    )

    db.add(status)
    db.commit()
    db.refresh(status)

    return status


@router.get("/publication-statuses")
def list_publication_statuses(db: Session = Depends(get_db)):
    return db.query(PublicationStatus).order_by(PublicationStatus.ordering).all()


@router.post("/publications")
def create_publication(payload: PublicationCreate, db: Session = Depends(get_db)):
    publication_code = generate_publication_code(db, payload.type)

    publication = Publication(
        publication_code=publication_code,
        type=payload.type,
        title=payload.title,
        current_status_id=payload.current_status_id,
        main_author_person_id=payload.main_author_person_id,
        supervisor_person_id=payload.supervisor_person_id,
        journal_name_optional=payload.journal_name_optional,
        conference_name_optional=payload.conference_name_optional,
        conference_date_optional=payload.conference_date_optional,
        conference_place_optional=payload.conference_place_optional,
        description_optional=payload.description_optional,
        created_by_person_id=payload.created_by_person_id,
    )

    db.add(publication)
    db.flush()

    for person_id in payload.collaborator_ids:
        db.add(PublicationCollaborator(publication_id=publication.id, person_id=person_id))

    for deadline in payload.deadlines:
        db.add(
            PublicationDeadline(
                publication_id=publication.id,
                publication_status_id=deadline.publication_status_id,
                deadline_optional=deadline.deadline_optional,
            )
        )

    create_log(
        db=db,
        action="created",
        entity_type="publication",
        entity_id=publication.id,
        actor_person_id=payload.created_by_person_id,
        summary=f"Publication created: {publication.publication_code} {publication.title}",
    )

    db.commit()
    db.refresh(publication)

    return publication_to_dict(db, publication)


@router.get("/publications")
def list_publications(db: Session = Depends(get_db)):
    publications = db.query(Publication).filter(
        Publication.archived == False
    ).order_by(Publication.created_at.desc()).all()

    return [publication_to_dict(db, publication) for publication in publications]

@router.get("/publications/{publication_id}")
def get_publication(publication_id: str, db: Session = Depends(get_db)):
    publication = db.query(Publication).filter(Publication.id == publication_id).first()

    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    return publication_to_dict(db, publication)


@router.put("/publications/{publication_id}")
def update_publication(
    publication_id: str,
    payload: PublicationUpdate,
    db: Session = Depends(get_db),
):
    publication = db.query(Publication).filter(Publication.id == publication_id).first()

    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    publication.type = payload.type
    publication.title = payload.title
    publication.current_status_id = payload.current_status_id
    publication.main_author_person_id = payload.main_author_person_id
    publication.supervisor_person_id = payload.supervisor_person_id
    publication.journal_name_optional = payload.journal_name_optional
    publication.conference_name_optional = payload.conference_name_optional
    publication.conference_date_optional = payload.conference_date_optional
    publication.conference_place_optional = payload.conference_place_optional
    publication.description_optional = payload.description_optional

    db.query(PublicationCollaborator).filter(
        PublicationCollaborator.publication_id == publication.id
    ).delete()

    db.query(PublicationDeadline).filter(
        PublicationDeadline.publication_id == publication.id
    ).delete()

    for person_id in payload.collaborator_ids:
        db.add(PublicationCollaborator(publication_id=publication.id, person_id=person_id))

    for deadline in payload.deadlines:
        db.add(
            PublicationDeadline(
                publication_id=publication.id,
                publication_status_id=deadline.publication_status_id,
                deadline_optional=deadline.deadline_optional,
            )
        )

    create_log(
        db=db,
        action="updated",
        entity_type="publication",
        entity_id=publication.id,
        summary=f"Publication updated: {publication.publication_code} {publication.title}",
    )

    db.commit()
    db.refresh(publication)

    return publication_to_dict(db, publication)


@router.patch("/publications/{publication_id}/archive")
def archive_publication(publication_id: str, db: Session = Depends(get_db)):
    publication = db.query(Publication).filter(Publication.id == publication_id).first()

    if publication is None:
        raise HTTPException(status_code=404, detail="Publication not found")

    publication.archived = True

    create_log(
        db=db,
        action="archived",
        entity_type="publication",
        entity_id=publication.id,
        summary=f"Publication archived: {publication.publication_code} {publication.title}",
    )

    db.commit()
    db.refresh(publication)

    return publication_to_dict(db, publication)

@router.post("/activities")
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    activity_code = generate_activity_code(db, payload.field_id)

    activity = Activity(
        activity_code=activity_code,
        title=payload.title,
        field_id=payload.field_id,
        description=payload.description,
        current_stage_id=payload.current_stage_id,
        main_assignee_person_id=payload.main_assignee_person_id,
        supervisor_person_id=payload.supervisor_person_id,
        created_by_person_id=payload.created_by_person_id,
    )

    db.add(activity)
    db.flush()

    for person_id in payload.collaborator_ids:
        db.add(ActivityCollaborator(activity_id=activity.id, person_id=person_id))

    for project_id in payload.project_ids:
        db.add(ActivityProject(activity_id=activity.id, project_id=project_id))

    for publication_id in payload.publication_ids:
        db.add(ActivityPublication(activity_id=activity.id, publication_id=publication_id))

    for deadline in payload.deadlines:
        db.add(
            ActivityDeadline(
                activity_id=activity.id,
                activity_stage_id=deadline.activity_stage_id,
                deadline_optional=deadline.deadline_optional,
            )
        )

    create_log(
        db=db,
        action="created",
        entity_type="activity",
        entity_id=activity.id,
        actor_person_id=payload.created_by_person_id,
        summary=f"Activity created: {activity.activity_code} {activity.title}",
    )

    db.commit()
    db.refresh(activity)

    return activity_to_dict(db, activity)


@router.get("/activities")
def list_activities(db: Session = Depends(get_db)):
    activities = db.query(Activity).filter(
        Activity.archived == False
    ).order_by(Activity.created_at.desc()).all()

    return [activity_to_dict(db, activity) for activity in activities]


@router.get("/activities/{activity_id}")
def get_activity(activity_id: str, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()

    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    return activity_to_dict(db, activity)


@router.put("/activities/{activity_id}")
def update_activity(activity_id: str, payload: ActivityUpdate, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()

    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.title = payload.title
    activity.field_id = payload.field_id
    activity.description = payload.description
    activity.current_stage_id = payload.current_stage_id
    activity.main_assignee_person_id = payload.main_assignee_person_id
    activity.supervisor_person_id = payload.supervisor_person_id

    db.query(ActivityCollaborator).filter(ActivityCollaborator.activity_id == activity.id).delete()
    db.query(ActivityProject).filter(ActivityProject.activity_id == activity.id).delete()
    db.query(ActivityPublication).filter(ActivityPublication.activity_id == activity.id).delete()
    db.query(ActivityDeadline).filter(ActivityDeadline.activity_id == activity.id).delete()

    for person_id in payload.collaborator_ids:
        db.add(ActivityCollaborator(activity_id=activity.id, person_id=person_id))

    for project_id in payload.project_ids:
        db.add(ActivityProject(activity_id=activity.id, project_id=project_id))

    for publication_id in payload.publication_ids:
        db.add(ActivityPublication(activity_id=activity.id, publication_id=publication_id))

    for deadline in payload.deadlines:
        db.add(
            ActivityDeadline(
                activity_id=activity.id,
                activity_stage_id=deadline.activity_stage_id,
                deadline_optional=deadline.deadline_optional,
            )
        )

    create_log(
        db=db,
        action="updated",
        entity_type="activity",
        entity_id=activity.id,
        summary=f"Activity updated: {activity.activity_code} {activity.title}",
    )

    db.commit()
    db.refresh(activity)

    return activity_to_dict(db, activity)


@router.patch("/activities/{activity_id}/archive")
def archive_activity(activity_id: str, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()

    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.archived = True

    create_log(
        db=db,
        action="archived",
        entity_type="activity",
        entity_id=activity.id,
        summary=f"Activity archived: {activity.activity_code} {activity.title}",
    )

    db.commit()
    db.refresh(activity)

    return activity_to_dict(db, activity)

@router.post("/meeting-types")
def create_meeting_type(payload: MeetingTypeCreate, db: Session = Depends(get_db)):
    item = MeetingType(
        name=payload.name,
        description_optional=payload.description_optional,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/meeting-types")
def list_meeting_types(db: Session = Depends(get_db)):
    return db.query(MeetingType).order_by(MeetingType.name).all()


@router.post("/meeting-purposes")
def create_meeting_purpose(payload: MeetingPurposeCreate, db: Session = Depends(get_db)):
    item = MeetingPurpose(
        name=payload.name,
        description_optional=payload.description_optional,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/meeting-purposes")
def list_meeting_purposes(db: Session = Depends(get_db)):
    return db.query(MeetingPurpose).order_by(MeetingPurpose.name).all()


@router.post("/meetings")
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db)):
    meeting = Meeting(
        title=payload.title,
        meeting_type_id=payload.meeting_type_id,
        organizer_person_id=payload.organizer_person_id,
        meeting_date=payload.meeting_date,
        start_time=payload.start_time,
        end_time_optional=payload.end_time_optional,
        description_optional=payload.description_optional,
    )

    db.add(meeting)
    db.flush()

    create_log(
        db=db,
        action="created",
        entity_type="meeting",
        entity_id=meeting.id,
        actor_person_id=payload.organizer_person_id,
        summary=f"Meeting created: {meeting.title}",
    )

    db.commit()
    db.refresh(meeting)

    return meeting_to_dict(db, meeting)


@router.get("/meetings")
def list_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).filter(
        Meeting.archived == False
    ).order_by(Meeting.meeting_date.desc(), Meeting.start_time.desc()).all()

    return [meeting_to_dict(db, meeting) for meeting in meetings]


@router.post("/meeting-slots")
def create_meeting_slot(payload: MeetingSlotCreate, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == payload.meeting_id).first()

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    slot = MeetingSlot(
        meeting_id=payload.meeting_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status="Open",
    )

    db.add(slot)

    create_log(
        db=db,
        action="created",
        entity_type="meeting_slot",
        entity_id=slot.id,
        actor_person_id=meeting.organizer_person_id,
        summary=f"Meeting slot created for {meeting.title}",
    )

    db.commit()
    db.refresh(slot)

    return meeting_slot_to_dict(db, slot)


@router.post("/meeting-slots/{slot_id}/take")
def take_meeting_slot(slot_id: str, payload: MeetingSlotTake, db: Session = Depends(get_db)):
    slot = db.query(MeetingSlot).filter(MeetingSlot.id == slot_id).first()

    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != "Open":
        raise HTTPException(status_code=400, detail="Slot is not open")

    activity = db.query(Activity).filter(Activity.id == payload.activity_id).first()

    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    slot.status = "Taken"
    slot.taken_by_person_id_optional = payload.taken_by_person_id
    slot.activity_id_optional = payload.activity_id
    slot.purpose_id_optional = payload.purpose_id
    slot.description_optional = payload.description_optional

    presenter_ids = payload.presenter_ids or [payload.taken_by_person_id]

    for person_id in presenter_ids:
        db.add(MeetingSlotPresenter(meeting_slot_id=slot.id, person_id=person_id))

    create_log(
        db=db,
        action="taken",
        entity_type="meeting_slot",
        entity_id=slot.id,
        actor_person_id=payload.taken_by_person_id,
        summary=f"Meeting slot taken for activity {activity.activity_code}",
    )

    db.commit()
    db.refresh(slot)

    return meeting_slot_to_dict(db, slot)


@router.post("/meeting-slots/{slot_id}/release")
def release_meeting_slot(slot_id: str, db: Session = Depends(get_db)):
    slot = db.query(MeetingSlot).filter(MeetingSlot.id == slot_id).first()

    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status not in ["Taken", "Not Presented"]:
        raise HTTPException(status_code=400, detail="Only taken slots can be released")

    db.query(MeetingSlotPresenter).filter(
        MeetingSlotPresenter.meeting_slot_id == slot.id
    ).delete()

    slot.status = "Open"
    slot.taken_by_person_id_optional = None
    slot.activity_id_optional = None
    slot.purpose_id_optional = None
    slot.description_optional = None
    slot.confirmed_presented = False

    create_log(
        db=db,
        action="released",
        entity_type="meeting_slot",
        entity_id=slot.id,
        summary="Meeting slot released",
    )

    db.commit()
    db.refresh(slot)

    return meeting_slot_to_dict(db, slot)


@router.post("/meeting-slots/{slot_id}/confirm")
def confirm_meeting_slot(slot_id: str, db: Session = Depends(get_db)):
    slot = db.query(MeetingSlot).filter(MeetingSlot.id == slot_id).first()

    if slot is None:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != "Taken":
        raise HTTPException(status_code=400, detail="Only taken slots can be confirmed")

    meeting = db.query(Meeting).filter(Meeting.id == slot.meeting_id).first()

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    slot.status = "Completed"
    slot.confirmed_presented = True

    if slot.activity_id_optional:
        activity = db.query(Activity).filter(Activity.id == slot.activity_id_optional).first()
        if activity is not None:
            activity.last_presented_at_optional = meeting.meeting_date

    create_log(
        db=db,
        action="confirmed",
        entity_type="meeting_slot",
        entity_id=slot.id,
        actor_person_id=meeting.organizer_person_id,
        summary="Meeting slot presentation confirmed",
    )

    db.commit()
    db.refresh(slot)

    return meeting_slot_to_dict(db, slot)

@router.post("/master-theses")
def create_master_thesis(payload: MasterThesisCreate, db: Session = Depends(get_db)):
    thesis = MasterThesis(
        thesis_code=generate_thesis_code(db),
        title=payload.title,
        keywords=payload.keywords,
        related_activity_optional=payload.related_activity_optional,
        related_project_optional=payload.related_project_optional,
        description=payload.description,
        prerequisites=payload.prerequisites,
        status="Available",
        created_by_person_id=payload.created_by_person_id,
    )

    db.add(thesis)
    db.flush()

    create_log(
        db=db,
        action="created",
        entity_type="master_thesis",
        entity_id=thesis.id,
        actor_person_id=payload.created_by_person_id,
        summary=f"Master thesis created: {thesis.thesis_code} {thesis.title}",
    )

    db.commit()
    db.refresh(thesis)

    return thesis_to_dict(db, thesis)


@router.get("/master-theses")
def list_master_theses(db: Session = Depends(get_db)):
    theses = db.query(MasterThesis).filter(
        MasterThesis.archived == False
    ).order_by(MasterThesis.created_at.desc()).all()

    return [thesis_to_dict(db, thesis) for thesis in theses]


@router.get("/master-theses/{thesis_id}")
def get_master_thesis(thesis_id: str, db: Session = Depends(get_db)):
    thesis = db.query(MasterThesis).filter(MasterThesis.id == thesis_id).first()

    if thesis is None:
        raise HTTPException(status_code=404, detail="Master thesis not found")

    return thesis_to_dict(db, thesis)


@router.put("/master-theses/{thesis_id}")
def update_master_thesis(
    thesis_id: str,
    payload: MasterThesisUpdate,
    db: Session = Depends(get_db),
):
    thesis = db.query(MasterThesis).filter(MasterThesis.id == thesis_id).first()

    if thesis is None:
        raise HTTPException(status_code=404, detail="Master thesis not found")

    if thesis.status != "Available":
        raise HTTPException(status_code=400, detail="Only available thesis ideas can be edited")

    thesis.title = payload.title
    thesis.keywords = payload.keywords
    thesis.related_activity_optional = payload.related_activity_optional
    thesis.related_project_optional = payload.related_project_optional
    thesis.description = payload.description
    thesis.prerequisites = payload.prerequisites

    create_log(
        db=db,
        action="updated",
        entity_type="master_thesis",
        entity_id=thesis.id,
        summary=f"Master thesis updated: {thesis.thesis_code} {thesis.title}",
    )

    db.commit()
    db.refresh(thesis)

    return thesis_to_dict(db, thesis)


@router.post("/master-theses/{thesis_id}/assign")
def assign_master_thesis(
    thesis_id: str,
    payload: MasterThesisAssign,
    db: Session = Depends(get_db),
):
    thesis = db.query(MasterThesis).filter(MasterThesis.id == thesis_id).first()

    if thesis is None:
        raise HTTPException(status_code=404, detail="Master thesis not found")

    if thesis.status != "Available":
        raise HTTPException(status_code=400, detail="Only available theses can be assigned")

    if not payload.supervisor_ids:
        raise HTTPException(status_code=400, detail="At least one supervisor is required")

    thesis.status = "Assigned"
    thesis.student_name_optional = payload.student_name
    thesis.assigned_at_optional = payload.assigned_at

    for supervisor_id in payload.supervisor_ids:
        db.add(ThesisSupervisor(thesis_id=thesis.id, person_id=supervisor_id))

    create_log(
        db=db,
        action="assigned",
        entity_type="master_thesis",
        entity_id=thesis.id,
        summary=f"Master thesis assigned: {thesis.thesis_code} to {payload.student_name}",
    )

    db.commit()
    db.refresh(thesis)

    return thesis_to_dict(db, thesis)


@router.post("/master-theses/{thesis_id}/complete")
def complete_master_thesis(
    thesis_id: str,
    payload: MasterThesisComplete,
    db: Session = Depends(get_db),
):
    thesis = db.query(MasterThesis).filter(MasterThesis.id == thesis_id).first()

    if thesis is None:
        raise HTTPException(status_code=404, detail="Master thesis not found")

    if thesis.status != "Assigned":
        raise HTTPException(status_code=400, detail="Only assigned theses can be completed")

    thesis.status = "Completed"
    thesis.completed_at_optional = payload.completed_at

    create_log(
        db=db,
        action="completed",
        entity_type="master_thesis",
        entity_id=thesis.id,
        summary=f"Master thesis completed: {thesis.thesis_code} {thesis.title}",
    )

    db.commit()
    db.refresh(thesis)

    return thesis_to_dict(db, thesis)


@router.patch("/master-theses/{thesis_id}/archive")
def archive_master_thesis(thesis_id: str, db: Session = Depends(get_db)):
    thesis = db.query(MasterThesis).filter(MasterThesis.id == thesis_id).first()

    if thesis is None:
        raise HTTPException(status_code=404, detail="Master thesis not found")

    thesis.archived = True

    create_log(
        db=db,
        action="archived",
        entity_type="master_thesis",
        entity_id=thesis.id,
        summary=f"Master thesis archived: {thesis.thesis_code} {thesis.title}",
    )

    db.commit()
    db.refresh(thesis)

    return thesis_to_dict(db, thesis)


@router.put("/roles/{role_id}")
def update_role(role_id: str, payload: RoleCreate, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()

    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")

    role.name = payload.name
    role.description = payload.description

    create_log(
        db=db,
        action="updated",
        entity_type="role",
        entity_id=role.id,
        summary=f"Role updated: {role.name}",
    )

    db.commit()
    db.refresh(role)

    return role


@router.delete("/roles/{role_id}")
def delete_role(role_id: str, db: Session = Depends(get_db)):
    role = db.query(Role).filter(Role.id == role_id).first()

    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")

    role.archived = True

    create_log(
        db=db,
        action="deactivated",
        entity_type="role",
        entity_id=role.id,
        summary=f"Role deactivated: {role.name}",
    )

    db.commit()
    db.refresh(role)

    return {"status": "deactivated"}

@router.put("/people/{person_id}")
def update_person(person_id: str, payload: PersonCreate, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == person_id).first()

    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    person.full_name = payload.full_name
    person.role_id = payload.role_id
    person.email_optional = payload.email_optional

    create_log(
        db=db,
        action="updated",
        entity_type="person",
        entity_id=person.id,
        summary=f"Person updated: {person.full_name}",
    )

    db.commit()
    db.refresh(person)

    return person


@router.delete("/people/{person_id}")
def delete_person(person_id: str, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == person_id).first()

    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    used_activity = db.query(Activity).filter(
        (Activity.main_assignee_person_id == person.id) |
        (Activity.supervisor_person_id == person.id) |
        (Activity.created_by_person_id == person.id)
    ).first()

    used_publication = db.query(Publication).filter(
        (Publication.main_author_person_id == person.id) |
        (Publication.supervisor_person_id == person.id) |
        (Publication.created_by_person_id == person.id)
    ).first()

    used_project = db.query(Project).filter(Project.created_by_person_id == person.id).first()
    used_meeting = db.query(Meeting).filter(Meeting.organizer_person_id == person.id).first()
    used_thesis = db.query(MasterThesis).filter(MasterThesis.created_by_person_id == person.id).first()

    used_links = (
        db.query(ActivityCollaborator).filter(ActivityCollaborator.person_id == person.id).first()
        or db.query(PublicationCollaborator).filter(PublicationCollaborator.person_id == person.id).first()
        or db.query(MeetingSlotPresenter).filter(MeetingSlotPresenter.person_id == person.id).first()
        or db.query(ThesisSupervisor).filter(ThesisSupervisor.person_id == person.id).first()
    )

    if used_activity or used_publication or used_project or used_meeting or used_thesis or used_links:
        raise HTTPException(status_code=400, detail="Cannot delete person because they are used in records")

    create_log(
        db=db,
        action="deleted",
        entity_type="person",
        entity_id=person.id,
        summary=f"Person deleted: {person.full_name}",
    )

    db.delete(person)
    db.commit()

    return {"status": "deleted"}

@router.put("/research-fields/{field_id}")
def update_research_field(
    field_id: str,
    payload: ResearchFieldCreate,
    db: Session = Depends(get_db),
):
    field = db.query(ResearchField).filter(ResearchField.id == field_id).first()

    if field is None:
        raise HTTPException(status_code=404, detail="Research field not found")

    field.name = payload.name
    field.prefix = payload.prefix.upper()
    field.description_optional = payload.description_optional

    create_log(
        db=db,
        action="updated",
        entity_type="research_field",
        entity_id=field.id,
        summary=f"Research field updated: {field.name}",
    )

    db.commit()
    db.refresh(field)

    return field


@router.delete("/research-fields/{field_id}")
def delete_research_field(field_id: str, db: Session = Depends(get_db)):
    field = db.query(ResearchField).filter(ResearchField.id == field_id).first()

    if field is None:
        raise HTTPException(status_code=404, detail="Research field not found")

    used = db.query(Activity).filter(Activity.field_id == field.id).first()

    if used is not None:
        raise HTTPException(status_code=400, detail="Cannot delete field because it is used by activities")

    create_log(
        db=db,
        action="deleted",
        entity_type="research_field",
        entity_id=field.id,
        summary=f"Research field deleted: {field.name}",
    )

    db.delete(field)
    db.commit()

    return {"status": "deleted"}

@router.put("/activity-stages/{stage_id}")
def update_activity_stage(
    stage_id: str,
    payload: ActivityStageCreate,
    db: Session = Depends(get_db),
):
    stage = db.query(ActivityStage).filter(ActivityStage.id == stage_id).first()

    if stage is None:
        raise HTTPException(status_code=404, detail="Activity stage not found")

    stage.name = payload.name
    stage.ordering = payload.ordering
    stage.description_optional = payload.description_optional

    create_log(
        db=db,
        action="updated",
        entity_type="activity_stage",
        entity_id=stage.id,
        summary=f"Activity stage updated: {stage.name}",
    )

    db.commit()
    db.refresh(stage)

    return stage


@router.delete("/activity-stages/{stage_id}")
def delete_activity_stage(stage_id: str, db: Session = Depends(get_db)):
    stage = db.query(ActivityStage).filter(ActivityStage.id == stage_id).first()

    if stage is None:
        raise HTTPException(status_code=404, detail="Activity stage not found")

    used_activity = db.query(Activity).filter(Activity.current_stage_id == stage.id).first()
    used_deadline = db.query(ActivityDeadline).filter(ActivityDeadline.activity_stage_id == stage.id).first()

    if used_activity or used_deadline:
        raise HTTPException(status_code=400, detail="Cannot delete stage because it is used by activities")

    create_log(
        db=db,
        action="deleted",
        entity_type="activity_stage",
        entity_id=stage.id,
        summary=f"Activity stage deleted: {stage.name}",
    )

    db.delete(stage)
    db.commit()

    return {"status": "deleted"}

@router.put("/publication-statuses/{status_id}")
def update_publication_status(
    status_id: str,
    payload: PublicationStatusCreate,
    db: Session = Depends(get_db),
):
    status = db.query(PublicationStatus).filter(PublicationStatus.id == status_id).first()

    if status is None:
        raise HTTPException(status_code=404, detail="Publication status not found")

    status.name = payload.name
    status.ordering = payload.ordering
    status.workflow_group = payload.workflow_group

    create_log(
        db=db,
        action="updated",
        entity_type="publication_status",
        entity_id=status.id,
        summary=f"Publication status updated: {status.name}",
    )

    db.commit()
    db.refresh(status)

    return status


@router.delete("/publication-statuses/{status_id}")
def delete_publication_status(status_id: str, db: Session = Depends(get_db)):
    status = db.query(PublicationStatus).filter(PublicationStatus.id == status_id).first()

    if status is None:
        raise HTTPException(status_code=404, detail="Publication status not found")

    used_publication = db.query(Publication).filter(Publication.current_status_id == status.id).first()
    used_deadline = db.query(PublicationDeadline).filter(PublicationDeadline.publication_status_id == status.id).first()

    if used_publication or used_deadline:
        raise HTTPException(status_code=400, detail="Cannot delete status because it is used by publications")

    create_log(
        db=db,
        action="deleted",
        entity_type="publication_status",
        entity_id=status.id,
        summary=f"Publication status deleted: {status.name}",
    )

    db.delete(status)
    db.commit()

    return {"status": "deleted"}

@router.put("/meeting-purposes/{purpose_id}")
def update_meeting_purpose(
    purpose_id: str,
    payload: MeetingPurposeCreate,
    db: Session = Depends(get_db),
):
    purpose = db.query(MeetingPurpose).filter(MeetingPurpose.id == purpose_id).first()

    if purpose is None:
        raise HTTPException(status_code=404, detail="Meeting purpose not found")

    purpose.name = payload.name
    purpose.description_optional = payload.description_optional

    create_log(
        db=db,
        action="updated",
        entity_type="meeting_purpose",
        entity_id=purpose.id,
        summary=f"Meeting purpose updated: {purpose.name}",
    )

    db.commit()
    db.refresh(purpose)

    return purpose


@router.delete("/meeting-purposes/{purpose_id}")
def delete_meeting_purpose(purpose_id: str, db: Session = Depends(get_db)):
    purpose = db.query(MeetingPurpose).filter(MeetingPurpose.id == purpose_id).first()

    if purpose is None:
        raise HTTPException(status_code=404, detail="Meeting purpose not found")

    used = db.query(MeetingSlot).filter(MeetingSlot.purpose_id_optional == purpose.id).first()

    if used is not None:
        raise HTTPException(status_code=400, detail="Cannot delete purpose because it is used by meeting slots")

    create_log(
        db=db,
        action="deleted",
        entity_type="meeting_purpose",
        entity_id=purpose.id,
        summary=f"Meeting purpose deleted: {purpose.name}",
    )

    db.delete(purpose)
    db.commit()

    return {"status": "deleted"}

@router.patch("/people/{person_id}/deactivate")
def deactivate_person(person_id: str, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == person_id).first()

    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    person.is_active = False
    person.archived = True

    create_log(
        db=db,
        action="deactivated",
        entity_type="person",
        entity_id=person.id,
        summary=f"Person deactivated: {person.full_name}",
    )

    db.commit()
    db.refresh(person)

    return person
