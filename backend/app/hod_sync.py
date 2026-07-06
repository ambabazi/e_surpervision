"""Ensure four department HODs, supervisors, and strong demo passwords."""

from app.auth import hash_password, verify_password
from app.demo_credentials import HOD_DEMO_PASSWORD, SUPERVISOR_DEMO_PASSWORD
from app.departments import Department
from app.models import Role, User

HOD_SEED: list[tuple[str, str, Department]] = [
    ("Dr. Morris Moraa", "hod.it@uok.ac.rw", Department.IT),
    ("Dr. Paul Nkurikiye", "hod.law@uok.ac.rw", Department.LAW),
    ("Dr. Alice Mukamana", "hod.business@uok.ac.rw", Department.BUSINESS),
    ("Dr. Beatrice Uwimana", "hod.education@uok.ac.rw", Department.EDUCATION),
]

SUPERVISOR_DEPTS: dict[str, Department] = {
    "jean.bosco@uok.ac.rw": Department.IT,
    "sarah.mukandoli@uok.ac.rw": Department.IT,
    "eric.habimana@uok.ac.rw": Department.IT,
    "it.nshuti@uok.ac.rw": Department.IT,
    "finance.uwase@uok.ac.rw": Department.BUSINESS,
    "business.mugisha@uok.ac.rw": Department.BUSINESS,
    "law.kamanzi@uok.ac.rw": Department.LAW,
    "law.uwase@uok.ac.rw": Department.LAW,
    "education.niyonsenga@uok.ac.rw": Department.EDUCATION,
    "education.mutoni@uok.ac.rw": Department.EDUCATION,
}

EXTRA_SUPERVISORS: list[tuple[str, str, str, Department]] = [
    ("Dr. Claire Uwase", "finance.uwase@uok.ac.rw", "Finance & Accounting", Department.BUSINESS),
    ("Dr. Kevin Mugisha", "business.mugisha@uok.ac.rw", "Marketing & Management", Department.BUSINESS),
    ("Dr. Emmanuel Kamanzi", "law.kamanzi@uok.ac.rw", "Commercial Law", Department.LAW),
    ("Dr. Grace Uwase", "law.uwase@uok.ac.rw", "Constitutional Law", Department.LAW),
    ("Dr. Diane Niyonsenga", "education.niyonsenga@uok.ac.rw", "Early Childhood Education", Department.EDUCATION),
    ("Dr. Patrick Mutoni", "education.mutoni@uok.ac.rw", "Curriculum Studies", Department.EDUCATION),
    ("Dr. Emmanuel Nshuti", "it.nshuti@uok.ac.rw", "Data Science", Department.IT),
]


def sync_department_structure(db) -> None:
    from app.models import TopicProposal
    from app.departments import department_for_program

    changed = False

    for name, email, dept in HOD_SEED:
        user = db.query(User).filter(User.email == email).first()
        dept_label = dept.value
        if not user:
            user = User(
                full_name=name,
                email=email,
                password=hash_password(HOD_DEMO_PASSWORD),
                role=Role.HOD,
                department=dept_label,
                title="Head of Department",
                program=dept_label,
                active=True,
            )
            db.add(user)
            changed = True
        else:
            if user.role != Role.HOD or user.department != dept_label:
                user.role = Role.HOD
                user.department = dept_label
                user.program = dept_label
                changed = True
            if not verify_password(HOD_DEMO_PASSWORD, user.password):
                user.password = hash_password(HOD_DEMO_PASSWORD)
                changed = True

    for name, email, program, dept in EXTRA_SUPERVISORS:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                full_name=name,
                email=email,
                password=hash_password(SUPERVISOR_DEMO_PASSWORD),
                role=Role.SUPERVISOR,
                department=dept.value,
                title="Dr.",
                program=program,
                active=True,
            )
            db.add(user)
            changed = True
        elif not verify_password(SUPERVISOR_DEMO_PASSWORD, user.password):
            user.password = hash_password(SUPERVISOR_DEMO_PASSWORD)
            changed = True

    for email, dept in SUPERVISOR_DEPTS.items():
        user = db.query(User).filter(User.email == email).first()
        if user:
            if user.department != dept.value:
                user.department = dept.value
                changed = True
            if user.role != Role.SUPERVISOR:
                user.role = Role.SUPERVISOR
                changed = True
            if not verify_password(SUPERVISOR_DEMO_PASSWORD, user.password):
                user.password = hash_password(SUPERVISOR_DEMO_PASSWORD)
                changed = True

    for proposal in db.query(TopicProposal).filter(TopicProposal.department.is_(None)).all():
        try:
            proposal.department = department_for_program(proposal.program).value
            changed = True
        except ValueError:
            proposal.department = Department.IT.value
            changed = True

    if changed:
        db.commit()
