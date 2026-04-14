import httpx
from dataclasses import dataclass
from typing import Optional
from attacks.loader import get_attacks as get_attack_templates, AttackTemplate


@dataclass
class AttackResult:
    template_id: str
    category: str
    payload: str
    severity: str
    response: Optional[str]
    error: Optional[str]


async def run_attack(
    template: AttackTemplate,
    target_url: str,
    model: str,
    api_key: str,
) -> AttackResult:
    """
    Sends a single attack payload to the target LLM endpoint.
    Expects an OpenAI-compatible /chat/completions API.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "messages": [{"role": "user", "content": template.payload}],
        "temperature": 0.0,
        "max_tokens": 512,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(target_url, headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            response_text = data["choices"][0]["message"]["content"]
            return AttackResult(
                template_id=template.id,
                category=template.category,
                payload=template.payload,
                severity=template.severity,
                response=response_text,
                error=None,
            )
    except Exception as e:
        return AttackResult(
            template_id=template.id,
            category=template.category,
            payload=template.payload,
            severity=template.severity,
            response=None,
            error=str(e),
        )