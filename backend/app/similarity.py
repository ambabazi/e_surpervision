import re
from difflib import SequenceMatcher


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {w for w in words if len(w) > 2}


def text_similarity(a: str, b: str) -> float:
    if not a.strip() or not b.strip():
        return 0.0
    ratio = SequenceMatcher(None, a.lower(), b.lower()).ratio()
    ta, tb = _tokens(a), _tokens(b)
    if not ta or not tb:
        return round(ratio * 100, 1)
    jaccard = len(ta & tb) / len(ta | tb)
    return round((ratio * 0.6 + jaccard * 0.4) * 100, 1)


def topic_similarity_scores(topic: str, abstract: str, existing_projects: list[tuple[str, str]]) -> float:
    """Return highest similarity % against existing project title+description pairs."""
    combined = f"{topic}. {abstract}".strip()
    if not existing_projects:
        return 0.0
    scores = [
        text_similarity(combined, f"{title}. {desc or ''}".strip())
        for title, desc in existing_projects
    ]
    return max(scores) if scores else 0.0


def score_proposal_topics(
    topics: list[tuple[str, str]],
    existing_projects: list[tuple[str, str]],
) -> list[dict]:
    results = []
    for index, (topic, abstract) in enumerate(topics, start=1):
        score = topic_similarity_scores(topic, abstract, existing_projects)
        level = "low" if score < 35 else "medium" if score < 65 else "high"
        results.append(
            {
                "topicIndex": index,
                "topic": topic,
                "similarityScore": score,
                "similarityLevel": level,
            }
        )
    return results
