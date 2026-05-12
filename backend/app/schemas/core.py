from typing import Optional

from pydantic import BaseModel


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoleRead(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class PersonCreate(BaseModel):
    full_name: str
    role_id: str
    email_optional: Optional[str] = None


class PersonRead(BaseModel):
    id: str
    full_name: str
    role_id: str
    email_optional: Optional[str] = None
    is_active: bool
    archived: bool

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    title: str
    status: str = "Applied"
    description: Optional[str] = None
    funding_body_optional: Optional[str] = None
    start_date_optional: Optional[str] = None
    end_date_optional: Optional[str] = None
    created_by_person_id: Optional[str] = None


class ProjectRead(BaseModel):
    id: str
    project_code_optional: Optional[str] = None
    title: str
    status: str
    description: Optional[str] = None
    funding_body_optional: Optional[str] = None
    start_date_optional: Optional[str] = None
    end_date_optional: Optional[str] = None
    created_by_person_id: Optional[str] = None
    archived: bool

    class Config:
        from_attributes = True