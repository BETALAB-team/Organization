from app.models.core import Person, Project


def is_admin(person: Person) -> bool:
    return person.role is not None and person.role.name.lower() == "admin"


def can_edit_project(person: Person, project: Project) -> bool:
    if is_admin(person):
        return True

    if project.created_by_person_id == person.id:
        return True

    return False