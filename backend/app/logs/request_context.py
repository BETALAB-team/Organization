from contextvars import ContextVar
from typing import Optional


current_actor_person_id: ContextVar[Optional[str]] = ContextVar(
    "current_actor_person_id",
    default=None,
)