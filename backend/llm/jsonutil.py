"""Pull a JSON object out of messy model output."""
import json
import re

_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.DOTALL | re.IGNORECASE)


def extract_json(text: str) -> dict:
    if not text or not text.strip():
        raise ValueError("empty model response")
    s = text.strip()

    fenced = _FENCE.search(s)
    if fenced:
        s = fenced.group(1).strip()

    try:
        data = json.loads(s)
    except json.JSONDecodeError:
        start, end = s.find("{"), s.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("no JSON object found in model output")
        data = json.loads(s[start : end + 1])

    if not isinstance(data, dict):
        raise ValueError("model output is not a JSON object")
    return data
