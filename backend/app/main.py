from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.logs.request_context import current_actor_person_id
from app.routes.core import router as core_router

app = FastAPI(
    title="Research Group Platform API",
    version="0.1.0",
)
@app.middleware("http")
async def actor_context_middleware(request, call_next):
    actor_person_id = request.headers.get("X-Person-Id")
    token = current_actor_person_id.set(actor_person_id)

    try:
        response = await call_next(request)
        return response
    finally:
        current_actor_person_id.reset(token)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://betalab-raci.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(core_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Research Group Platform API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}