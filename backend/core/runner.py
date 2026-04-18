"""
Sends adversarial payloads to the target LLM.
Supports any OpenAI-compatible API endpoint.
"""
import time
from dataclasses import dataclass

from openai import OpenAI


@dataclass
class RunnerResult:
    response_text: str
    response_time_ms: int
    error: str | None = None


def run_attack(
    target_url: str,
    target_model: str,
    payload: str,
    api_key: str = "EMPTY",   # some local endpoints don't need a real key
    timeout: int = 10,
) -> RunnerResult:
    """
    Send a single adversarial payload to the target LLM.
    Returns the raw response text and latency.
    """
    # Strip trailing slash — OpenAI client adds its own paths
    base_url = target_url.rstrip("/")

    client = OpenAI(api_key=api_key, base_url=base_url)

    start = time.monotonic()
    try:
        completion = client.chat.completions.create(
            model=target_model,
            messages=[{"role": "user", "content": payload}],
            timeout=timeout,
            max_tokens=1024,
        )
        elapsed_ms = int((time.monotonic() - start) * 1000)
        response_text = completion.choices[0].message.content or ""
        return RunnerResult(response_text=response_text, response_time_ms=elapsed_ms)

    except Exception as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return RunnerResult(
            response_text="",
            response_time_ms=elapsed_ms,
            error=str(e),
        )