"""
The ONLY place that talks to the model.

Everything else calls LLMClient.generate_json(...). To change provider or
model, change environment variables - no other code changes.
"""
import json
import logging
from typing import Type, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

import config
from errors import LLMError

from .jsonutil import extract_json

log = logging.getLogger("llm")
T = TypeVar("T", bound=BaseModel)


class OllamaProvider:
    """Runs Gemma 4 locally through Ollama."""

    def __init__(self) -> None:
        import ollama

        self._ollama = ollama
        self.model = config.OLLAMA_MODEL
        self.client = ollama.Client(
            host=config.OLLAMA_BASE_URL, timeout=config.LLM_TIMEOUT
        )

    def generate(self, system: str, user: str, schema: dict, temperature: float) -> str:
        try:
            resp = self.client.chat(
                model=self.model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                format=schema,  # forces the output to match our JSON schema
                options={"temperature": temperature},
            )
            return resp["message"]["content"] or ""
        except self._ollama.ResponseError as e:
            if getattr(e, "status_code", None) == 404:
                raise LLMError(
                    "model_not_found",
                    f"Model '{self.model}' is not installed. Run: ollama pull {self.model}",
                    503,
                ) from e
            raise LLMError("llm_error", "The AI model returned an error.", 502) from e
        except httpx.TimeoutException as e:
            raise LLMError(
                "llm_timeout", "The AI model took too long to respond.", 504
            ) from e
        except (ConnectionError, httpx.ConnectError) as e:
            raise LLMError(
                "llm_unavailable",
                "Cannot reach Ollama. Is it running? (open the Ollama app)",
                503,
            ) from e


class GeminiProvider:
    """Hosted Gemma through the Gemini API. Untested placeholder for deployment."""

    def __init__(self) -> None:
        if not config.GEMINI_API_KEY:
            raise LLMError("config_error", "GEMINI_API_KEY is not set.", 500)
        from google import genai
        from google.genai import types

        self._types = types
        self.model = config.GEMINI_MODEL
        self.client = genai.Client(api_key=config.GEMINI_API_KEY)

    def generate(self, system: str, user: str, schema: dict, temperature: float) -> str:
        # Instructions are folded into the prompt: Gemma models may not accept
        # a separate system instruction or JSON mode on the Gemini API.
        prompt = f"{system}\n\n---\n\n{user}"
        try:
            resp = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=self._types.GenerateContentConfig(temperature=temperature),
            )
            return resp.text or ""
        except Exception as e:  # noqa: BLE001
            log.warning("Gemini call failed: %s", type(e).__name__)
            raise LLMError("llm_error", "The AI model request failed.", 502) from e


class LLMClient:
    def __init__(self) -> None:
        name = config.LLM_PROVIDER.lower()
        if name == "ollama":
            self.provider = OllamaProvider()
        elif name == "gemini":
            self.provider = GeminiProvider()
        else:
            raise LLMError("config_error", f"Unknown LLM_PROVIDER '{name}'.", 500)

    @staticmethod
    def _parse(raw: str, model_cls: Type[T]) -> T:
        return model_cls.model_validate(extract_json(raw))

    def generate_json(
        self, system: str, user: str, model_cls: Type[T], temperature: float = 0.2
    ) -> T:
        schema = model_cls.model_json_schema()
        full_system = (
            system + "\n\nReturn JSON matching this JSON schema:\n" + json.dumps(schema)
        )

        raw = self.provider.generate(full_system, user, schema, temperature)
        try:
            return self._parse(raw, model_cls)
        except (ValueError, ValidationError) as first_error:
            # Never log the raw text: it can contain resume content.
            log.warning("Invalid model output (%s); retrying once", type(first_error).__name__)
            repair_user = (
                f"{user}\n\nYour previous reply was invalid. Problem: "
                f"{str(first_error)[:500]}\n\nPrevious reply:\n{raw[:2000]}\n\n"
                "Reply again with ONLY the corrected JSON object."
            )
            raw2 = self.provider.generate(full_system, repair_user, schema, 0.0)
            try:
                return self._parse(raw2, model_cls)
            except (ValueError, ValidationError) as e:
                raise LLMError(
                    "bad_model_output",
                    "The AI returned an unusable answer. Please try again.",
                    502,
                ) from e
