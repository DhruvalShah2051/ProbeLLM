from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from api.routes import scans, auth, ws
from dotenv import load_dotenv
import os
from db.database import engine, Base
import db.models
import sys
print("[main] starting up...", file=sys.stderr, flush=True)

load_dotenv()

security = HTTPBearer()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LLM Red Teaming Platform", version="0.1.0")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scans.router, prefix="/api/scans", tags=["scans"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ws.router, prefix="/ws", tags=["websocket"])

@app.get("/health")
def health():
    return {"status": "ok"}