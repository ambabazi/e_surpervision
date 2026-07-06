"""Demo passwords and helpers — documented in README for local/viva use."""

# Staff demo passwords (uppercase, lowercase, digit, symbol)
HOD_DEMO_PASSWORD = "Uok@Hod2026!"
SUPERVISOR_DEMO_PASSWORD = "Uok@Sup2026!"

# Example registration number (raw digits or formatted)
EXAMPLE_REG_RAW = "202305000090"
EXAMPLE_REG_FORMATTED = "UOK/2023/05000090"


def format_registration_number(raw: str) -> str:
    """Normalize 202305000090 → UOK/2023/05000090."""
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) >= 10:
        year = digits[0:4]
        serial = digits[4:].lstrip("0") or "0"
        serial = serial.zfill(6) if len(serial) <= 6 else serial
        return f"UOK/{year}/{serial}"
    cleaned = raw.strip().upper()
    if cleaned.startswith("UOK/"):
        return cleaned
    return raw.strip().upper()


def student_demo_password(registration_number: str) -> str:
    """Strong student password derived from registration number."""
    digits = "".join(c for c in registration_number if c.isdigit()) or "202305000090"
    return f"Stu@{digits}!"
