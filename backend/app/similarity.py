import re
from difflib import SequenceMatcher

# Generic capstone wording — ignored when deciding if two titles are related.
_STOPWORDS = {
    "and", "for", "the", "with", "using", "based", "web", "mobile", "app", "system",
    "design", "development", "implementation", "management", "platform", "application",
    "project", "study", "analysis", "smart", "digital", "online", "automated", "how",
    "learn", "reduce", "home", "language", "test", "monitoring", "box", "access",
}


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", normalize_text(text))
    return {w for w in words if len(w) > 2}


def _significant_tokens(text: str) -> set[str]:
    return {w for w in _tokens(text) if w not in _STOPWORDS}


def normalize_text(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    cleaned = re.sub(r"[^a-z0-9\s]", " ", (text or "").lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def title_similarity(proposed: str, existing: str) -> float:
    """Compare capstone titles — exact/near-exact matches score ~100%."""
    a = normalize_text(proposed)
    b = normalize_text(existing)
    if not a or not b:
        return 0.0

    if a == b:
        return 100.0

    ta, tb = _tokens(proposed), _tokens(existing)
    if ta and tb and ta == tb:
        return 100.0

    sa, sb = _significant_tokens(proposed), _significant_tokens(existing)
    if sa and sb and not (sa & sb):
        return 0.0

    ratio = SequenceMatcher(None, a, b).ratio()
    if ratio >= 0.97:
        return 100.0

    compare_a, compare_b = (sa or ta), (sb or tb)
    if compare_a and compare_b:
        overlap = len(compare_a & compare_b)
        union = len(compare_a | compare_b)
        jaccard = overlap / union if union else 0.0

        shorter, longer = (compare_a, compare_b) if len(compare_a) <= len(compare_b) else (compare_b, compare_a)
        if shorter and shorter.issubset(longer):
            coverage = len(shorter) / len(longer)
            if coverage >= 0.75:
                return round(95.0 + 5.0 * coverage, 1)

        if jaccard < 0.15 and ratio < 0.5:
            return 0.0

        title_score = ratio * 0.45 + jaccard * 0.55
        return round(min(100.0, title_score * 100), 1)

    return round(ratio * 100, 1) if ratio >= 0.5 else 0.0


def text_similarity(a: str, b: str) -> float:
    if not a.strip() or not b.strip():
        return 0.0
    sa, sb = _significant_tokens(a), _significant_tokens(b)
    if sa and sb and not (sa & sb):
        return 0.0
    na, nb = normalize_text(a), normalize_text(b)
    ratio = SequenceMatcher(None, na, nb).ratio()
    ta, tb = _significant_tokens(a) or _tokens(a), _significant_tokens(b) or _tokens(b)
    if not ta or not tb:
        return round(ratio * 100, 1) if ratio >= 0.5 else 0.0
    jaccard = len(ta & tb) / len(ta | tb)
    if jaccard < 0.1 and ratio < 0.45:
        return 0.0
    return round((ratio * 0.5 + jaccard * 0.5) * 100, 1)


# Scores below this are treated as no meaningful match in the UI.
MIN_MEANINGFUL_SCORE = 10.0


def topic_similarity_match(
    topic: str,
    abstract: str,
    existing_topics: list[tuple[str, str]],
) -> tuple[float, str | None]:
    """Return highest similarity % and the matched approved/reference topic title."""
    if not existing_topics:
        return 0.0, None

    best_score = 0.0
    best_title: str | None = None
    for title, desc in existing_topics:
        title_score = title_similarity(topic, title)
        if title_score >= 99.0:
            return 100.0, title

        combined_score = text_similarity(
            f"{topic}. {abstract}".strip(),
            f"{title}. {desc or ''}".strip(),
        )
        score = min(100.0, round(title_score * 0.95 + combined_score * 0.05, 1))
        if score > best_score:
            best_score = score
            best_title = title

    if best_score < MIN_MEANINGFUL_SCORE:
        return 0.0, None

    return best_score, best_title


def score_proposal_topics(
    topics: list[tuple[str, str]],
    existing_topics: list[tuple[str, str]],
) -> list[dict]:
    results = []
    for index, (topic, abstract) in enumerate(topics, start=1):
        score, matched = topic_similarity_match(topic, abstract, existing_topics)
        level = "low" if score < 35 else "medium" if score < 65 else "high"
        results.append(
            {
                "topicIndex": index,
                "topic": topic,
                "similarityScore": score,
                "similarityLevel": level,
                "similarTo": matched,
            }
        )
    return results
