import os
import yaml
from dataclasses import dataclass
from typing import Optional


@dataclass
class AttackTemplate:
    id: str
    category: str
    severity: str
    payload: str
    description: str
    judge_guidance: Optional[str] = None
    owasp_id: Optional[str] = None


LIBRARY_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "attack-library")


def _load_attack_file(attack_id: str) -> dict:
    """
    Converts an attack id like 'injection/basic_override'
    into a file path and loads the YAML.
    """
    relative_path = attack_id.replace("/", os.sep) + ".yaml"
    full_path = os.path.join(LIBRARY_PATH, relative_path)
    with open(full_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_attacks(categories: list[str] = None) -> list[AttackTemplate]:
    """
    Loads all attack templates from the library, optionally filtered by category.
    Expands each YAML file into one AttackTemplate per payload.
    """
    index_path = os.path.join(LIBRARY_PATH, "index.yaml")
    with open(index_path, "r", encoding="utf-8") as f:
        index = yaml.safe_load(f)

    templates = []

    for entry in index["attacks"]:
        if categories and entry["category"] not in categories:
            continue

        try:
            data = _load_attack_file(entry["id"])
        except FileNotFoundError:
            print(f"[loader] warning: file not found for {entry['id']}, skipping")
            continue

        for i, payload in enumerate(data.get("payloads", [])):
            templates.append(AttackTemplate(
                id=f"{data['id']}/payload_{i}",
                category=data["category"],
                severity=data.get("severity_hint", "medium"),
                payload=payload,
                description=data.get("description", ""),
                judge_guidance=data.get("judge_guidance"),
                owasp_id=data.get("owasp_id"),
            ))

    return templates