"""
E-Supervision ER diagram — Chen notation, single ink, minimal relationship lines.
Attributes inside entities; shared trunks between relationship diamonds.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, Polygon, Rectangle

OUT = Path(__file__).resolve().parent.parent / "docs" / "e-supervision-erd.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

INK = "#401020"
PAPER = "#FFFEF8"
LW = 2.0


def text(ax, x, y, s, *, size=12, bold=False, ha="center", va="center"):
    ax.text(x, y, s, ha=ha, va=va, fontsize=size, fontweight="bold" if bold else "normal",
            color=INK, zorder=40, family="DejaVu Sans", clip_on=False)


def seg(ax, a, b):
    ax.plot([a[0], b[0]], [a[1], b[1]], color=INK, lw=LW, solid_capstyle="round", zorder=2)


def route(ax, points):
    for i in range(len(points) - 1):
        a, b = points[i], points[i + 1]
        if a[0] != b[0] and a[1] != b[1]:
            seg(ax, a, (b[0], a[1]))
            seg(ax, (b[0], a[1]), b)
        else:
            seg(ax, a, b)


def entity(ax, cx, cy, name, fields, *, w=3.5):
    th, lh = 0.52, 0.30
    bh = lh * len(fields) + 0.22
    h = th + bh
    x, y = cx - w / 2, cy - h / 2
    ax.add_patch(Rectangle((x, y), w, h, lw=LW, ec=INK, fc=PAPER, zorder=8))
    ax.add_patch(Rectangle((x, y + bh), w, th, lw=0, fc=INK, zorder=9))
    text(ax, cx, y + bh + th / 2, name, size=13, bold=True)
    ax.plot([x, x + w], [y + bh, y + bh], color=INK, lw=LW * 0.75, zorder=10)
    for i, f in enumerate(fields):
        text(ax, cx, y + bh - 0.18 - i * lh, f, size=10)
    return {"x": cx, "y": cy, "w": w, "h": h}


def rel(ax, cx, cy, label, s=0.50):
    pts = [(cx, cy + s), (cx + s * 1.15, cy), (cx, cy - s), (cx - s * 1.15, cy)]
    ax.add_patch(Polygon(pts, closed=True, lw=LW, ec=INK, fc=PAPER, zorder=12))
    text(ax, cx, cy, label, size=10, bold=True)
    return (cx, cy)


def pin(e, side):
    if side == "N":
        return e["x"], e["y"] + e["h"] / 2
    if side == "S":
        return e["x"], e["y"] - e["h"] / 2
    if side == "W":
        return e["x"] - e["w"] / 2, e["y"]
    return e["x"] + e["w"] / 2, e["y"]


def card(ax, x, y, v):
    text(ax, x, y, v, size=10, bold=True)


plt.rcParams["font.family"] = "DejaVu Sans"

with plt.xkcd(scale=0.8, length=40, randomness=0.5):
    fig, ax = plt.subplots(figsize=(30, 22))
    ax.set_xlim(0, 30)
    ax.set_ylim(0, 22)
    ax.axis("off")
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)

    text(ax, 15, 21.0, "E-Supervision System — Entity Relationship Diagram", size=19, bold=True)
    text(ax, 15, 20.35, "University of Kigali  ·  Chen notation", size=11)

    # ── entities ──────────────────────────────────────────────────────────────
    user = entity(ax, 11, 12, "User", [
        "id", "email", "registration number", "name", "department", "password",
    ])

    proposal = entity(ax, 4.5, 17.5, "Topic Proposal", [
        "id", "registration number", "department", "topic", "status",
        "supervisor choice 1 id", "supervisor choice 2 id",
    ], w=3.7)

    notif = entity(ax, 25, 17.5, "Notification", [
        "id", "user id", "message", "type", "is read", "created at",
    ])

    sup_req = entity(ax, 4.5, 6, "Superviser Student Request", [
        "id", "status", "requested at",
    ], w=3.9)

    project = entity(ax, 21, 12, "Project", [
        "id", "status", "progress", "due date",
    ], w=3.3)

    task = entity(ax, 15, 3.5, "Task", [
        "id", "title", "description", "status", "due date",
    ])

    submission = entity(ax, 21, 3.5, "Submission", [
        "id", "file url", "file name", "status", "submitted at",
    ], w=3.5)

    feedback = entity(ax, 27, 3.5, "Feedback", [
        "id", "comment", "created at",
    ], w=3.1)

    # ── relationships (shared trunks, fewest segments) ────────────────────────

    # User — Topic Proposal
    hub_n = (11, 15.2)
    route(ax, [pin(user, "N"), hub_n])
    r1 = rel(ax, 7.0, 16.3, "Submits")
    r2 = rel(ax, 7.0, 15.0, "Supervises")
    route(ax, [hub_n, r1, pin(proposal, "S")])
    route(ax, [hub_n, r2, pin(proposal, "S")])
    card(ax, 9.5, 15.6, "1")
    card(ax, 5.5, 16.7, "M")
    card(ax, 5.5, 15.4, "M")
    ax.add_patch(Ellipse((6.0, 16.0), 1.5, 0.48, lw=LW * 0.8, ec=INK, fc=PAPER, zorder=11))
    text(ax, 6.0, 16.0, "created at", size=9)
    route(ax, [r1, (6.0, 16.0)])

    # User — Notification
    r3 = rel(ax, 18, 17.5, "Receives")
    route(ax, [pin(user, "N"), (11, 17.5), r3, pin(notif, "W")])
    card(ax, 14, 17.9, "1")
    card(ax, 23.5, 17.9, "M")

    # User — Superviser Student Request
    hub_s = (11, 9.2)
    route(ax, [pin(user, "S"), hub_s])
    r4 = rel(ax, 7.5, 8.0, "Requests")
    r5 = rel(ax, 7.5, 6.7, "Responds To")
    route(ax, [hub_s, r4, pin(sup_req, "N")])
    route(ax, [hub_s, r5, pin(sup_req, "N")])
    card(ax, 9.8, 9.6, "1")
    card(ax, 4.0, 8.4, "M")
    card(ax, 4.0, 7.1, "M")

    # User — Project
    hub_e = (16, 12)
    route(ax, [pin(user, "E"), hub_e])
    r6 = rel(ax, 17.5, 12.7, "Studies In")
    r7 = rel(ax, 17.5, 11.3, "Over Sees")
    route(ax, [hub_e, r6, pin(project, "W")])
    route(ax, [hub_e, r7, pin(project, "W")])
    card(ax, 15.2, 13.1, "1")
    card(ax, 15.2, 10.9, "1")
    card(ax, 19.5, 13.1, "M")
    card(ax, 19.5, 10.9, "M")

    # User — Feedback (bottom lane)
    r8 = rel(ax, 25.5, 1.5, "Gives")
    route(ax, [pin(user, "S"), (11, 1.5), r8, pin(feedback, "S")])
    card(ax, 13, 1.9, "1")
    card(ax, 26.5, 1.9, "M")

    # Project — Task / Submission / Feedback (one Has, three drops)
    drop = (21, 9.0)
    route(ax, [pin(project, "S"), drop])
    r9 = rel(ax, 21, 7.5, "Has")
    route(ax, [drop, r9])
    for e in (task, submission, feedback):
        route(ax, [r9, (e["x"], 7.5), pin(e, "N")])
    card(ax, 21, 8.5, "1")
    for e, ox in ((task, 15), (submission, 21), (feedback, 27)):
        card(ax, ox, 5.8, "M")

    # Submission — Feedback
    r10 = rel(ax, 24, 3.5, "Has")
    route(ax, [pin(submission, "E"), r10, pin(feedback, "W")])
    card(ax, 22.5, 3.9, "1")
    card(ax, 25.5, 3.9, "M")

    # ── legend ────────────────────────────────────────────────────────────────
    lx, ly = 1.0, 19.5
    text(ax, lx, ly + 0.6, "Legend", size=12, bold=True, ha="left")
    ax.add_patch(Rectangle((lx, ly), 1.6, 0.48, lw=LW, ec=INK, fc=PAPER))
    text(ax, lx + 0.8, ly + 0.24, "Entity", size=9)
    ax.add_patch(Polygon(
        [(lx + 3.0, ly + 0.55), (lx + 3.5, ly + 0.24), (lx + 3.0, ly - 0.08), (lx + 2.5, ly + 0.24)],
        closed=True, lw=LW, ec=INK, fc=PAPER,
    ))
    text(ax, lx + 3.0, ly + 0.24, "Rel", size=9)
    text(ax, lx + 4.2, ly + 0.24, "Relationship", size=9, ha="left")
    text(ax, lx, ly - 0.55, "Fields listed inside each entity (no attribute spokes).", size=9, ha="left")
    text(ax, lx, ly - 1.0, "1 = one     ·     M = many", size=9, ha="left")

    fig.savefig(OUT, dpi=250, bbox_inches="tight", facecolor=PAPER, pad_inches=0.4)
    print(f"Saved: {OUT}")
