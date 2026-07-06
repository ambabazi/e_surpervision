from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.demo_credentials import EXAMPLE_REG_NUMBER, HOD_DEMO_PASSWORD, SUPERVISOR_DEMO_PASSWORD, student_demo_password
from app.models import (
    Feedback,
    Notification,
    NotificationType,
    Priority,
    Project,
    ProjectStatus,
    ProposalStatus,
    RequestStatus,
    Role,
    Submission,
    SubmissionStatus,
    SupervisorStudentRequest,
    Task,
    TaskStatus,
    TopicProposal,
    User,
)


def seed_sample_proposals(db: Session) -> None:
    """Proposals are created inside seed_demo_data; nothing extra needed."""
    return


def seed_demo_data(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    # --- Staff ---
    hod_it = _staff(db, "Dr. Morris Moraa", "hod.it@uok.ac.rw", Role.HOD, "IT", HOD_DEMO_PASSWORD)
    hod_law = _staff(db, "Dr. Paul Nkurikiye", "hod.law@uok.ac.rw", Role.HOD, "LAW", HOD_DEMO_PASSWORD)
    hod_business = _staff(db, "Dr. Alice Mukamana", "hod.business@uok.ac.rw", Role.HOD, "BUSINESS", HOD_DEMO_PASSWORD)
    hod_edu = _staff(db, "Dr. Beatrice Uwimana", "hod.education@uok.ac.rw", Role.HOD, "EDUCATION", HOD_DEMO_PASSWORD)

    bosco = _staff(db, "Dr. Jean Bosco", "jean.bosco@uok.ac.rw", Role.SUPERVISOR, "IT", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Software Engineering")
    mukandoli = _staff(db, "Prof. Sarah Mukandoli", "sarah.mukandoli@uok.ac.rw", Role.SUPERVISOR, "IT", SUPERVISOR_DEMO_PASSWORD, "Prof.", "Information Systems")
    habimana = _staff(db, "Dr. Eric Habimana", "eric.habimana@uok.ac.rw", Role.SUPERVISOR, "IT", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Cybersecurity")
    nshuti = _staff(db, "Dr. Emmanuel Nshuti", "it.nshuti@uok.ac.rw", Role.SUPERVISOR, "IT", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Data Science")
    finance = _staff(db, "Dr. Claire Uwase", "finance.uwase@uok.ac.rw", Role.SUPERVISOR, "BUSINESS", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Finance & Accounting")
    biz_mug = _staff(db, "Dr. Kevin Mugisha", "business.mugisha@uok.ac.rw", Role.SUPERVISOR, "BUSINESS", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Marketing")
    law_kam = _staff(db, "Dr. Emmanuel Kamanzi", "law.kamanzi@uok.ac.rw", Role.SUPERVISOR, "LAW", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Commercial Law")
    law_uwa = _staff(db, "Dr. Grace Uwase", "law.uwase@uok.ac.rw", Role.SUPERVISOR, "LAW", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Constitutional Law")
    edu_niy = _staff(db, "Dr. Diane Niyonsenga", "education.niyonsenga@uok.ac.rw", Role.SUPERVISOR, "EDUCATION", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Early Childhood")
    edu_mut = _staff(db, "Dr. Patrick Mutoni", "education.mutoni@uok.ac.rw", Role.SUPERVISOR, "EDUCATION", SUPERVISOR_DEMO_PASSWORD, "Dr.", "Curriculum Studies")

    # --- Featured student (example reg 202305000090) ---
    aggie = _student(
        db, "Aggie Moraa", "aggie.moraa.capstone@gmail.com", EXAMPLE_REG_NUMBER,
        "BSc Software Engineering", "IT", "+250 788 300 100",
        student_demo_password(EXAMPLE_REG_NUMBER),
    )
    aggie_project = _project(
        db,
        "AI-Driven Academic Supervision Platform",
        "A web platform streamlining capstone supervision between students, supervisors, and HODs.",
        "Chapter 3", ProjectStatus.IN_PROGRESS, 68,
        date.today() - timedelta(days=95), date.today() + timedelta(days=18),
        aggie, bosco,
    )
    _seed_it_project_detail(db, aggie_project, aggie, bosco)

    # --- IT students ---
    emmanuel = _student(db, "Emmanuel Nshuti", "emmanuel.nshuti.dev@gmail.com", "202205000145",
                        "BSc Software Engineering", "IT", "+250 788 300 302", student_demo_password("202205000145"))
    em_proj = _project(db, "Blockchain for Health Records", "Permissioned blockchain for patient records.",
                       "Chapter 4", ProjectStatus.UNDER_REVIEW, 82,
                       date.today() - timedelta(days=140), date.today() + timedelta(days=14), emmanuel, bosco)
    _submission(db, em_proj, "Chapter 4 - Implementation", "Smart contracts and access control.", SubmissionStatus.UNDER_REVIEW, days_ago=2)
    _submission(db, em_proj, "Chapter 3 - Methodology", "Research design and ethics.", SubmissionStatus.APPROVED, days_ago=20)

    clarisse = _student(db, "Clarisse Mutoni", "clarisse.mutoni.ml@gmail.com", "202205000188",
                        "BSc Information Systems", "IT", "+250 788 300 303", student_demo_password("202205000188"))
    cl_proj = _project(db, "ML Crop Yield Prediction", "Predicting yields for smallholder farmers.",
                       "Chapter 3", ProjectStatus.IN_PROGRESS, 55,
                       date.today() - timedelta(days=80), date.today() + timedelta(days=30), clarisse, nshuti)
    s_cl = _submission(db, cl_proj, "Dataset & Model Plan", "Datasets and baseline models.", SubmissionStatus.SUBMITTED, days_ago=1)

    leon = _student(db, "Leon Kagabo", "leon.kagabo.access@gmail.com", "202205000201",
                    "BSc Software Engineering", "IT", "+250 788 300 304", student_demo_password("202205000201"))
    _project(db, "Accessible E-Learning Platform", "Screen-reader-first e-learning design.",
             "Chapter 2", ProjectStatus.REVISION, 38,
             date.today() - timedelta(days=55), date.today() + timedelta(days=45), leon, mukandoli)

    diane = _student(db, "Diane Ingabire", "diane.ingabire.iot@gmail.com", "202205000112",
                     "BSc Information Systems", "IT", "+250 788 300 305", student_demo_password("202205000112"))
    di_proj = _project(db, "Smart Campus IoT Dashboard", "Facilities management sensor dashboard.",
                       "Chapter 3", ProjectStatus.IN_PROGRESS, 72,
                       date.today() - timedelta(days=110), date.today() + timedelta(days=12), diane, mukandoli)
    _task(db, di_proj, "Sensor API Integration", "Integrate MQTT feeds.", "DEVELOPMENT", TaskStatus.IN_PROGRESS, Priority.HIGH, 80, date.today() + timedelta(days=5), False)

    patrick = _student(db, "Patrick Niyonsenga", "patrick.cyber@gmail.com", "202105000067",
                       "BSc Cybersecurity", "IT", "+250 788 300 306", student_demo_password("202105000067"))
    _project(db, "Deep Learning Intrusion Detection", "Network IDS using deep learning.",
             "Chapter 5", ProjectStatus.COMPLETED, 100,
             date.today() - timedelta(days=200), date.today() - timedelta(days=3), patrick, habimana)

    aline = _student(db, "Aline Uwimana", "aline.uwimana.study@gmail.com", "202205000210",
                     "BSc Software Engineering", "IT", "+250 788 300 307", student_demo_password("202205000210"))
    kevin = _student(db, "Kevin Mugisha", "kevin.mugisha.dev@gmail.com", "202205000215",
                     "BSc Cybersecurity", "IT", "+250 788 300 308", student_demo_password("202205000215"))

    # --- Law students ---
    law_st1 = _student(db, "Immaculee Kayitesi", "immaculee.kayitesi.law@gmail.com", "202205000301",
                       "LLB Commercial Law", "LAW", "+250 788 310 401", student_demo_password("202205000301"))
    law_p1 = _project(db, "Digital Contract Enforcement in Rwanda", "Legal framework for e-contracts.",
                      "Chapter 3", ProjectStatus.IN_PROGRESS, 60,
                      date.today() - timedelta(days=100), date.today() + timedelta(days=25), law_st1, law_kam)
    _submission(db, law_p1, "Literature Review Draft", "Comparative contract law review.", SubmissionStatus.UNDER_REVIEW, days_ago=4)

    law_st2 = _student(db, "Fabrice Habimana", "fabrice.habimana.law@gmail.com", "202305000302",
                       "LLB Human Rights Law", "LAW", "+250 788 310 402", student_demo_password("202305000302"))
    _project(db, "Access to Justice for Rural Communities", "Barriers and policy recommendations.",
             "Chapter 2", ProjectStatus.PROPOSAL, 15,
             date.today() - timedelta(days=20), date.today() + timedelta(days=120), law_st2, law_uwa)

    # --- Business students ---
    biz_st1 = _student(db, "Chantal Uwase", "chantal.uwase.business@gmail.com", "202205000401",
                       "BBA Finance", "BUSINESS", "+250 788 320 501", student_demo_password("202205000401"))
    biz_p1 = _project(db, "SME Credit Risk Modelling", "Credit scoring for Rwandan SMEs.",
                      "Chapter 4", ProjectStatus.UNDER_REVIEW, 74,
                      date.today() - timedelta(days=130), date.today() + timedelta(days=16), biz_st1, finance)
    _submission(db, biz_p1, "Financial Analysis Chapter", "Quantitative risk models.", SubmissionStatus.SUBMITTED, days_ago=3)

    biz_st2 = _student(db, "Eric Nkurunziza", "eric.nkurunziza.mba@gmail.com", "202305000402",
                       "BBA Marketing", "BUSINESS", "+250 788 320 502", student_demo_password("202305000402"))
    _project(db, "Social Media ROI for Local Retail", "Measuring campaign effectiveness.",
             "Chapter 2", ProjectStatus.IN_PROGRESS, 42,
             date.today() - timedelta(days=60), date.today() + timedelta(days=40), biz_st2, biz_mug)

    # --- Education students ---
    edu_st1 = _student(db, "Marie Claire Ingabire", "marie.ingabire.edu@gmail.com", "202205000501",
                       "BEd Early Childhood", "EDUCATION", "+250 788 330 601", student_demo_password("202205000501"))
    edu_p1 = _project(db, "Play-Based Learning in Kigali Preschools", "Classroom intervention study.",
                      "Chapter 3", ProjectStatus.IN_PROGRESS, 58,
                      date.today() - timedelta(days=90), date.today() + timedelta(days=28), edu_st1, edu_niy)
    _submission(db, edu_p1, "Field Observation Report", "Week 4 classroom notes.", SubmissionStatus.APPROVED, days_ago=10)

    edu_st2 = _student(db, "Samuel Bizimana", "samuel.bizimana.teacher@gmail.com", "202305000502",
                       "BEd Curriculum Studies", "EDUCATION", "+250 788 330 602", student_demo_password("202305000502"))
    _project(db, "Competency-Based Assessment Tools", "Rubrics aligned to CBC policy.",
             "Chapter 2", ProjectStatus.REVISION, 35,
             date.today() - timedelta(days=45), date.today() + timedelta(days=50), edu_st2, edu_mut)

    # --- Topic proposals (pending / approved / rejected) ---
    db.add(TopicProposal(
        full_name="Samuel Nkurunziza", email="samuel.nkurunziza@gmail.com",
        registration_number="202305000150", phone="+250 788 400 401",
        program="BSc Software Engineering", department="IT",
        topic_1="AI Student Advising Chatbot", abstract_1="NLP chatbot for course planning.",
        topic_2="Campus Navigation App", abstract_2="Cross-platform campus navigation.",
        topic_3="Thesis Format Checker", abstract_3="Automated thesis validation.",
        supervisor_choice_1_id=bosco.id, supervisor_choice_2_id=mukandoli.id,
        status=ProposalStatus.PENDING,
    ))
    db.add(TopicProposal(
        full_name="Divine Uwimana", email="divine.uwimana@gmail.com",
        registration_number="202305000155", phone="+250 788 400 405",
        program="LLB Commercial Law", department="LAW",
        topic_1="Arbitration in Cross-Border Trade", abstract_1="Regional dispute resolution.",
        topic_2="Consumer Protection Online", abstract_2="E-commerce liability.",
        topic_3="Corporate Governance Reforms", abstract_3="Board accountability trends.",
        supervisor_choice_1_id=law_kam.id, supervisor_choice_2_id=law_uwa.id,
        status=ProposalStatus.PENDING,
    ))
    db.add(TopicProposal(
        full_name="Grace Mukamana", email="grace.mukamana@gmail.com",
        registration_number="202305000160", phone="+250 788 400 410",
        program="BBA Finance", department="BUSINESS",
        topic_1="Microfinance Portfolio Analysis", abstract_1="Risk in SACCO lending.",
        topic_2="Green Investment Funds", abstract_2="ESG metrics for Rwanda.",
        topic_3="Mobile Money Fraud Detection", abstract_3="Anomaly detection models.",
        supervisor_choice_1_id=finance.id, supervisor_choice_2_id=biz_mug.id,
        status=ProposalStatus.PENDING,
    ))
    db.add(TopicProposal(
        full_name="Rejected Applicant", email="rejected.applicant@gmail.com",
        registration_number="202305000199", phone="+250 788 400 499",
        program="BSc Software Engineering", department="IT",
        topic_1="Generic Web App", abstract_1="A simple CRUD app.",
        topic_2="Todo List Clone", abstract_2="Another todo app.",
        topic_3="Blog Platform", abstract_3="Basic blogging site.",
        supervisor_choice_1_id=bosco.id, supervisor_choice_2_id=habimana.id,
        status=ProposalStatus.REJECTED, rejection_reason="Topics lack academic depth and originality.",
    ))

    # --- Supervisor ↔ HOD requests ---
    db.add(SupervisorStudentRequest(
        supervisor_id=bosco.id,
        message="I have capacity for one more software engineering student this semester.",
        status=RequestStatus.PENDING,
    ))
    db.add(SupervisorStudentRequest(
        supervisor_id=finance.id,
        message="Requesting approval to supervise an additional finance capstone student.",
        status=RequestStatus.APPROVED,
        hod_response="Approved — assign from pending business applicants.",
    ))
    db.add(SupervisorStudentRequest(
        supervisor_id=law_kam.id,
        message="Can I take a second commercial law student?",
        status=RequestStatus.REJECTED,
        hod_response="Current load is sufficient until next intake.",
    ))

    # --- Notifications ---
    _notification(db, aggie, "Upcoming Deadline", "Final Design Submission is due in 18 days.",
                  NotificationType.DEADLINE, Priority.HIGH, False, "/student/progress")
    _notification(db, aggie, "New Feedback Received", "Dr. Jean Bosco commented on your Literature Review.",
                  NotificationType.FEEDBACK, Priority.MEDIUM, False, "/student/feedback")
    _notification(db, aggie, "Supervisor Assigned", "Dr. Jean Bosco is your capstone supervisor.",
                  NotificationType.ASSIGNMENT, Priority.LOW, True, "/student")
    _notification(db, hod_it, "Pending Topic Proposals", "3 IT applicants await your review.",
                  NotificationType.APPROVAL, Priority.HIGH, False, "/hod/proposals")
    _notification(db, hod_law, "Pending Topic Proposals", "1 law applicant awaits review.",
                  NotificationType.APPROVAL, Priority.MEDIUM, False, "/hod/proposals")
    _notification(db, hod_it, "Unassigned Students", "2 IT students need supervisor allocation.",
                  NotificationType.SYSTEM, Priority.HIGH, False, "/hod/students")
    _notification(db, bosco, "New Submission", "Emmanuel Nshuti submitted Chapter 4 - Implementation.",
                  NotificationType.ASSIGNMENT, Priority.MEDIUM, False, "/supervisor/reviews")
    _notification(db, bosco, "Review Reminder", "4 submissions pending review (2 approaching 7-day deadline).",
                  NotificationType.DEADLINE, Priority.HIGH, False, "/supervisor/reviews")
    _notification(db, mukandoli, "Student Request Update", "Clarisse Mutoni submitted Dataset & Model Plan.",
                  NotificationType.FEEDBACK, Priority.LOW, False, "/supervisor/reviews")
    _notification(db, hod_business, "Supervisor Request", "Dr. Claire Uwase requested an additional student.",
                  NotificationType.APPROVAL, Priority.MEDIUM, True, "/hod/requests")

    db.commit()


def _seed_it_project_detail(db, project, student, supervisor):
    _task(db, project, "Literature Review & Analysis", "Review supervision platforms and academic workflow tools.",
          "RESEARCH", TaskStatus.IN_PROGRESS, Priority.HIGH, 65, date.today() - timedelta(days=3), False)
    _task(db, project, "System Architecture Diagram", "Backend layers and integration diagrams.",
          "DESIGN", TaskStatus.IN_PROGRESS, Priority.MEDIUM, 45, date.today() + timedelta(days=8), False)
    _task(db, project, "Database Schema & UI Mockups", "Relational schema and portal mockups.",
          "DESIGN", TaskStatus.UPCOMING, Priority.MEDIUM, 15, date.today() + timedelta(days=14), False)
    _task(db, project, "Proposal Approved", "Capstone proposal approved.", "MILESTONE", TaskStatus.COMPLETED, Priority.HIGH, 100, date.today() - timedelta(days=80), True)
    _task(db, project, "Final Design Submission", "Complete design documentation.", "MILESTONE", TaskStatus.UPCOMING, Priority.HIGH, 0, date.today() + timedelta(days=18), True)

    s1 = _submission(db, project, "Chapter 2 - Literature Review",
                     "Draft literature review for supervisor review.", SubmissionStatus.UNDER_REVIEW, days_ago=6)
    _feedback(db, project, supervisor, "Feedback on Literature Review",
              "Strong domain coverage. Add 2024–2025 references on academic workflow automation.", s1, days_ago=5)
    _feedback(db, project, supervisor, "Proposal Approved",
              "Excellent proposal — proceed to detailed design.", None, days_ago=79)
    s2 = _submission(db, project, "Chapter 1 - Introduction", "Introduction and problem statement.", SubmissionStatus.APPROVED, days_ago=30)
    _feedback(db, project, supervisor, "Introduction Review", "Clear problem statement and objectives.", s2, days_ago=28)


def _staff(db, full_name, email, role, department, password, title="Head of Department", program=None):
    u = User(
        full_name=full_name,
        email=email,
        password=hash_password(password),
        role=role,
        department=department,
        title=title if role != Role.HOD else "Head of Department",
        program=program or department,
        phone="+250 788 200 000",
        bio=f"{full_name} — University of Kigali capstone programme.",
        active=True,
    )
    db.add(u)
    db.flush()
    return u


def _student(db, full_name, email, reg_number, program, department, phone, password):
    u = User(
        full_name=full_name,
        email=email.lower(),
        registration_number=reg_number,
        password=hash_password(password),
        role=Role.STUDENT,
        department=department,
        title="Final Year Project",
        program=program,
        phone=phone,
        bio=f"{full_name} — {program} capstone candidate.",
        active=True,
    )
    db.add(u)
    db.flush()
    return u


def _project(db, title, description, phase, status, progress, start, due, student, supervisor):
    p = Project(
        title=title, description=description, current_phase=phase, status=status,
        progress=progress, start_date=start, due_date=due,
        student_id=student.id, supervisor_id=supervisor.id,
    )
    db.add(p)
    db.flush()
    return p


def _task(db, project, title, description, category, status, priority, progress, due, milestone):
    db.add(Task(
        project_id=project.id, title=title, description=description, category=category,
        status=status, priority=priority, progress=progress, due_date=due, milestone=milestone,
    ))


def _submission(db, project, title, notes, status, *, days_ago=0):
    s = Submission(
        project_id=project.id, title=title, notes=notes, status=status,
        file_name=title.replace(" ", "_").replace("-", "_") + ".pdf",
        submitted_at=datetime.utcnow() - timedelta(days=days_ago),
    )
    db.add(s)
    db.flush()
    return s


def _feedback(db, project, author, title, content, submission, *, days_ago=0):
    db.add(Feedback(
        project_id=project.id, author_id=author.id, title=title, content=content,
        submission_id=submission.id if submission else None,
        created_at=datetime.utcnow() - timedelta(days=days_ago),
    ))


def _notification(db, user, title, message, ntype, severity, read, action_path=None):
    db.add(Notification(
        user_id=user.id, title=title, message=message, type=ntype, severity=severity,
        read=read, action_path=action_path, created_at=datetime.utcnow(),
    ))
