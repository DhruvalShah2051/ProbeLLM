"""
Loads and parses YAML attack templates from the attack library.
"""
import os
from pathlib import Path
from typing import Optional
import yaml

from db.models import AttackCategory


# ---------------------------------------------------------------------------
# Data class (plain dict is fine, but a dataclass keeps IDE happy)
# ---------------------------------------------------------------------------

from dataclasses import dataclass, field


@dataclass
class AttackTemplate:
    id: str
    category: AttackCategory
    owasp_id: str
    severity_hint: str
    description: str
    payloads: list[str]
    judge_guidance: str
    success_indicators: list[str] = field(default_factory=list)
    failure_indicators: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Loader
# ---------------------------------------------------------------------------

def load_templates(
    library_path: str,
    categories: Optional[list[AttackCategory]] = None,
) -> list[AttackTemplate]:
    """
    Walk the attack library directory and return all templates
    matching the requested categories. If categories is None, load all.
    """
    root = Path(library_path)
    if not root.exists():
        raise FileNotFoundError(f"Attack library not found at: {root.resolve()}")

    category_names = {c.value for c in categories} if categories else None
    templates: list[AttackTemplate] = []

    for yaml_file in sorted(root.rglob("*.yaml")):
        # Skip the index file at root level
        if yaml_file.name == "index.yaml":
            continue

        with open(yaml_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        # Filter by category if specified
        file_category = data.get("category", "")
        if category_names and file_category not in category_names:
            continue

        try:
            template = AttackTemplate(
                id=data["id"],
                category=AttackCategory(file_category),
                owasp_id=data.get("owasp_id", ""),
                severity_hint=data.get("severity_hint", "medium"),
                description=data.get("description", ""),
                payloads=data.get("payloads", []),
                judge_guidance=data.get("judge_guidance", ""),
                success_indicators=data.get("success_criteria", {}).get("indicators", []),
                failure_indicators=data.get("success_criteria", {}).get("failure_indicators", []),
            )
            templates.append(template)
        except (KeyError, ValueError) as e:
            print(f"[loader] Skipping {yaml_file.name}: {e}")

    return templates