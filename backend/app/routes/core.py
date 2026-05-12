from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.core import Log, Person, Project, Role
from app.schemas.core import (
    PersonCreate,
    PersonRead,
    ProjectCreate,
    ProjectRead,
    RoleCreate,
    RoleRead,
)
from app.services.log_service import create_log

router = APIRouter()


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
    return db.query(Role).order_by(Role.name).all()


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
    return db.query(Person).filter(Person.archived == False).order_by(Person.full_name).all()


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