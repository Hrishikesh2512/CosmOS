"""FastAPI application entry point for Genesis."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .. import __version__
from .routes import router

app = FastAPI(
    title="Genesis API",
    description="Universe creation and evolution simulator.",
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "Genesis", "version": __version__, "docs": "/docs"}
