"""Demo passwords and UoK registration number format.

Registration number (12 digits): YYYYTTNNNNNN
  YYYY     — year you started (e.g. 2023)
  TT       — intake term: 01 January, 05 May, 09 September
  NNNNNN   — your student number (e.g. 000078)
Example: 202305000078
"""

STAFF_DEFAULT_PASSWORD = "Password@123"

EXAMPLE_REG_NUMBER = "202305000078"


def format_registration_number(raw: str) -> str:
    """Normalize input to 12-digit UoK registration number."""
    cleaned = raw.strip().upper()
    digits = "".join(c for c in raw if c.isdigit())

    # Fix legacy 14-digit values from an earlier bug (leading 0 padding)
    if len(digits) == 13 and digits.startswith("0"):
        digits = digits[1:]

    if len(digits) == 12:
        return digits

    if cleaned.startswith("UOK/"):
        parts = cleaned.split("/")
        if len(parts) >= 3 and parts[1].isdigit() and parts[2].isdigit():
            year = parts[1]
            serial = parts[2].zfill(6)[-6:]
            intake = "05"
            return f"{year}{intake}{serial}"

    if len(digits) == 13:
        return digits[-12:]

    raise ValueError(
        "Registration number must be 12 digits (YYYYTTNNNNNN), e.g. 202305000078"
    )


def student_password(registration_number: str) -> str:
    """Student portal password equals registration number."""
    return format_registration_number(registration_number)
