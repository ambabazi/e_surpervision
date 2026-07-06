import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_token, verify_password
from app.demo_credentials import format_registration_number
from app.models import Role, User
from app.schemas import AuthResponse
from app.services import user_out

UOK_STAFF_EMAIL = re.compile(r"^[a-zA-Z0-9._%+-]+@uok\.ac\.rw$", re.IGNORECASE)


def normalize_reg_number(value: str) -> str:
    try:
        return format_registration_number(value)
    except ValueError:
        return value.strip()


def authenticate_user(db: Session, *, identifier: str, password: str, portal: Role | None) -> User:
    identifier = identifier.strip()
    if not identifier or not password:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    if portal == Role.STUDENT or "@" not in identifier:
        try:
            reg = format_registration_number(identifier)
        except ValueError as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

        user = db.query(User).filter(User.registration_number == reg, User.role == Role.STUDENT).first()
        pwd = format_registration_number(password) if password.replace(" ", "").isdigit() else password
        if not user or not verify_password(pwd, user.password):
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED,
                "Invalid registration number or password",
            )
        if portal == Role.STUDENT and user.role != Role.STUDENT:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Use the correct portal for your account")
        return user

    email = identifier.lower()
    if not UOK_STAFF_EMAIL.match(email):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Supervisors and HOD must sign in with their University of Kigali email (@uok.ac.rw). "
            "Personal emails such as Gmail are not permitted.",
        )

    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    if portal in (Role.SUPERVISOR, Role.HOD) and user.role != portal:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"This account is not a {portal.value.lower()} account. Use the correct portal.",
        )

    if user.role in (Role.SUPERVISOR, Role.HOD) and not UOK_STAFF_EMAIL.match(user.email):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Only University of Kigali staff emails (@uok.ac.rw) are allowed.",
        )

    return user


def login_user(db: Session, *, identifier: str, password: str, portal: Role | None) -> AuthResponse:
    user = authenticate_user(db, identifier=identifier, password=password, portal=portal)
    token = create_token(
        email=user.email,
        user_id=user.id,
        role=user.role.value,
        full_name=user.full_name,
    )
    return AuthResponse(token=token, user=user_out(user))
