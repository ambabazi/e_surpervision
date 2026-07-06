"""Demo passwords and UoK registration number format.

Registration number (13 digits): YYYYTTNNNNNN
  YYYY     — year you started (e.g. 2023)
  TT       — intake term: 01 January, 05 May, 09 September
  NNNNNN   — your student number (e.g. 000078)
Example: 202305000078
"""

# Staff demo passwords (uppercase, lowercase, digit, symbol)
HOD_DEMO_PASSWORD = "Uok@Hod2026!"
SUPERVISOR_DEMO_PASSWORD = "Uok@Sup2026!"

EXAMPLE_REG_NUMBER = "202305000078"

INTAKE_LABELS = {
    "01": "January",
    "05": "May",
    "09": "September",
}


def format_registration_number(raw: str) -> str:
    """Normalize input to 13-digit UoK registration number."""
    cleaned = raw.strip().upper()
    digits = "".join(c for c in raw if c.isdigit())

    if len(digits) == 13:
        return digits

    # Legacy UOK/2023/05000078 → 202305000078
    if cleaned.startswith("UOK/"):
        parts = cleaned.split("/")
        if len(parts) >= 3 and parts[1].isdigit() and parts[2].isdigit():
            year = parts[1]
            serial = parts[2].zfill(6)[-6:]
            intake = "05"
            return f"{year}{intake}{serial}"

    if len(digits) == 12:
        return f"0{digits}"

    if len(digits) > 13:
        return digits[-13:]

    raise ValueError(
        "Registration number must be 13 digits (YYYYTTNNNNNN), e.g. 202305000078"
    )


def student_demo_password(registration_number: str) -> str:
    """Strong student password derived from registration number."""
    reg = format_registration_number(registration_number)
    return f"Stu@{reg}!"
