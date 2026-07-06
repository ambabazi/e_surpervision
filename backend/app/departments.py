import enum
import re


class Department(str, enum.Enum):
    IT = "IT"
    LAW = "LAW"
    BUSINESS = "BUSINESS"
    EDUCATION = "EDUCATION"


DEPARTMENT_LABELS: dict[Department, str] = {
    Department.IT: "Information Technology",
    Department.LAW: "Law",
    Department.BUSINESS: "Business",
    Department.EDUCATION: "Education",
}

PROGRAMS_BY_DEPARTMENT: dict[Department, list[str]] = {
    Department.IT: [
        "BSc Information Technology",
        "BSc Computer Science",
        "BSc Business Information Technology",
        "BSc Software Engineering",
        "BSc Cybersecurity",
        "BSc Information Systems",
    ],
    Department.BUSINESS: [
        "BSc Marketing",
        "BSc Supplies and Procurement Management",
        "BSc Economics",
        "BSc Finance",
        "BSc Accounting",
        "BA Public Administration and Local Governance",
    ],
    Department.EDUCATION: [
        "BEd Early Childhood Development Education",
    ],
    Department.LAW: [
        "LLB Law",
    ],
}

ALL_PROGRAMS: list[str] = [p for progs in PROGRAMS_BY_DEPARTMENT.values() for p in progs]

_PROGRAM_LOOKUP: dict[str, Department] = {}
for dept, programs in PROGRAMS_BY_DEPARTMENT.items():
    for program in programs:
        _PROGRAM_LOOKUP[program.lower()] = dept
        _PROGRAM_LOOKUP[re.sub(r"^bsc\s+|^bed\s+|^ba\s+|^llb\s+", "", program.lower())] = dept


def department_for_program(program: str) -> Department:
    key = program.strip().lower()
    if key in _PROGRAM_LOOKUP:
        return _PROGRAM_LOOKUP[key]
    for fragment, dept in _PROGRAM_LOOKUP.items():
        if fragment in key or key in fragment:
            return dept
    if any(k in key for k in ("law", "legal")):
        return Department.LAW
    if any(k in key for k in ("education", "teaching", "ecd")):
        return Department.EDUCATION
    if any(k in key for k in ("account", "finance", "market", "econom", "business", "procurement", "administration")):
        return Department.BUSINESS
    if any(k in key for k in ("computer", "software", "information", "cyber", "technology", "it")):
        return Department.IT
    raise ValueError(f"Unknown program: {program}")


def parse_department(value: str) -> Department:
    return Department(value.strip().upper())
