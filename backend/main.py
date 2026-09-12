import os
from typing import List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv()

AZURE_FOUNDRY_ENDPOINT = os.getenv("AZURE_FOUNDRY_ENDPOINT")
AZURE_FOUNDRY_API_KEY = os.getenv("AZURE_FOUNDRY_API_KEY")
AZURE_FOUNDRY_MODEL = os.getenv("AZURE_FOUNDRY_MODEL")

_configured = all([AZURE_FOUNDRY_ENDPOINT, AZURE_FOUNDRY_API_KEY, AZURE_FOUNDRY_MODEL])
if not _configured:
    print(
        "[aviso] Configure AZURE_FOUNDRY_ENDPOINT, AZURE_FOUNDRY_API_KEY e "
        "AZURE_FOUNDRY_MODEL no arquivo .env (veja .env.example)."
    )

client = AsyncOpenAI(
    base_url=AZURE_FOUNDRY_ENDPOINT or "",
    api_key=AZURE_FOUNDRY_API_KEY or "",
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


SYSTEM_PROMPT = "Você é um assistente útil e direto ao ponto."


@app.get("/api/health")
def health():
    return {"status": "ok", "azure_configured": _configured}


@app.post("/api/chat")
async def chat(payload: ChatRequest):
    if not _configured:
        raise HTTPException(
            status_code=500,
            detail=(
                "Backend sem as variáveis do Azure Foundry configuradas. "
                "Confere o arquivo .env."
            ),
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in payload.history]
    messages.append({"role": "user", "content": payload.message})

    async def token_stream():
        try:
            async with client.responses.stream(
                model=AZURE_FOUNDRY_MODEL,
                input=messages,
            ) as stream:
                async for event in stream:
                    if event.type == "response.output_text.delta":
                        yield event.delta
        except Exception as exc:
            yield f"\n\n[erro ao chamar o Azure Foundry: {exc}]"

    return StreamingResponse(token_stream(), media_type="text/plain")