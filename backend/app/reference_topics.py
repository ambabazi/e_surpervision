"""Archived capstone topics used as the similarity comparison baseline."""

from sqlalchemy.orm import Session

from app.models import ReferenceTopic

IT_REFERENCE_TOPICS: list[tuple[str, str]] = [
    (
        "Smart Vending and Canteen Inventory System Using IoT",
        "IoT sensors and dashboards for campus cafeteria stock, sales, and replenishment.",
    ),
    (
        "Unity Scholar",
        "Gamified academic progress and peer-learning platform for university students.",
    ),
    (
        "AI-Powered Kinyarwanda Language Learning Companion",
        "Conversational AI tutor for Kinyarwanda vocabulary, grammar, and pronunciation.",
    ),
    (
        "Inter-University Academic Transcript Exchange System",
        "Secure digital transcript sharing between Rwandan universities.",
    ),
    (
        "Incident Pin",
        "Campus safety incident reporting and response coordination mobile app.",
    ),
    (
        "Web-Based Sponsor Child Support Coordination System",
        "Portal linking sponsors, NGOs, and beneficiaries for transparent child support.",
    ),
    (
        "Location Identification Bus Using Bluetooth and Voice Announcement",
        "Accessible bus stop detection with Bluetooth beacons and audio announcements.",
    ),
    (
        "Smart NFC Anti-Tamper Delivery Box for High-Value Goods Security",
        "NFC-sealed parcel box with tamper alerts for secure last-mile delivery.",
    ),
    (
        "AI Image and Video Detector",
        "Deep-learning system to classify and flag manipulated media content.",
    ),
    (
        "Grant and Compliance Management System for NGOs in Rwanda",
        "Workflow platform for grant tracking, reporting, and donor compliance.",
    ),
    (
        "Site Safety Monitoring System",
        "Wearables and dashboards for construction site hazard monitoring.",
    ),
    (
        "Alcohol Drunk and Drive Test System with Entry Gate Access",
        "Breathalyser-integrated gate control for venues and fleet depots.",
    ),
]


def ensure_reference_topics(db: Session) -> int:
    """Insert department reference topics when missing (safe on every startup)."""
    added = 0
    for title, description in IT_REFERENCE_TOPICS:
        exists = (
            db.query(ReferenceTopic)
            .filter(ReferenceTopic.department == "IT", ReferenceTopic.title == title)
            .first()
        )
        if exists:
            continue
        db.add(ReferenceTopic(title=title, description=description, department="IT"))
        added += 1
    if added:
        db.commit()
    return added
