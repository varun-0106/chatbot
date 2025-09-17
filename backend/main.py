# backend/main.py
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import ollama
import asyncio

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat(request: Request):
    body = await request.json()
    prompt = body.get("message", "").lower().strip()

    # 🔹 Custom override: respond directly if asked about creator
    if any(q in prompt for q in ["who created you", "who made you", "who built you", "creator", "made by"]):
        async def creator_response():
            yield "I was created by Varun Chavan 🚀"
        return StreamingResponse(creator_response(), media_type="text/plain")

    # 🔹 Normal AI response
    async def stream_response():
        stream = ollama.chat(
            model="llama3",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )
        for chunk in stream:
            if "message" in chunk and "content" in chunk["message"]:
                yield chunk["message"]["content"]
                await asyncio.sleep(0)

    return StreamingResponse(stream_response(), media_type="text/plain")
