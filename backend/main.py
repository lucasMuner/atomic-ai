import os
from typing import List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AzureOpenAI
from pydantic import BaseModel

load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")
# ATENÇÃO: isso é o nome do DEPLOYMENT que você deu no Azure AI Foundry /
# Azure OpenAI Studio (ex.: "meu-gpt4o-mini"), não o nome do modelo em si
# (ex.: "gpt-4o-mini"). É o valor que a API do Azure espera em `model=`.
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

_configured = all([AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT])
if not _configured:
    print(
        "[aviso] Configure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY e "
        "AZURE_OPENAI_DEPLOYMENT no arquivo .env (veja .env.example)."
    )

client = AzureOpenAI(
    azure_endpoint=AZURE_OPENAI_ENDPOINT or "",
    api_key=AZURE_OPENAI_API_KEY or "",
    api_version=AZURE_OPENAI_API_VERSION,
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
def chat(payload: ChatRequest):
    if not _configured:
        raise HTTPException(
            status_code=500,
            detail=(
                "Backend sem as variáveis do Azure OpenAI configuradas. "
                "Confere o arquivo .env."
            ),
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in payload.history]
    messages.append({"role": "user", "content": payload.message})

    def token_stream():
        try:
            response = client.chat.completions.create(
                model=AZURE_OPENAI_DEPLOYMENT,
                messages=messages,
                stream=True,
            )
            for chunk in response:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    yield delta.content
        except Exception as exc:
            # manda o erro como texto pro front conseguir mostrar algo em vez
            # de travar no meio do stream sem explicação
            yield f"\n\n[erro ao chamar o Azure OpenAI: {exc}]"

    return StreamingResponse(token_stream(), media_type="text/plain")