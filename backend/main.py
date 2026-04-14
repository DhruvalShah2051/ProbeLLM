from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import scans
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="LLM Red Teaming Platform", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scans.router, prefix="/api/scans", tags=["scans"])

@app.get("/health")
def health():
    return {"status": "ok"}