from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.core import router as core_router

app = FastAPI(
    title="Research Group Platform API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "betalab-raci.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Research Group Platform API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}