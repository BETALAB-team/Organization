from typing import Optional

from sqlalchemy.orm import Session

from app.models.core import Log


def create_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_person_id: Optional[str] = None,
    summary: Optional[str] = None,
    changed_fields_optional: Optional[str] = None,
) -> Log:
    log = Log(
        actor_person_id=actor_person_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        changed_fields_optional=changed_fields_optional,
    )

    db.add(log)
    return log