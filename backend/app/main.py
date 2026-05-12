from fastapi import FastAPI

from app.routes.core import router as core_router

app = FastAPI(
    title="Research Group Platform API",
    version="0.1.0",
)

app.include_router(core_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Research Group Platform API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}