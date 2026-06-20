"""Integration tests for the FastAPI layer."""

import pytest
from fastapi.testclient import TestClient

from genesis.api.main import app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # Isolate the repository file per test run.
    from genesis.api import routes
    from genesis.storage.repository import UniverseRepository
    routes.repo = UniverseRepository(tmp_path / "universes.json")
    return TestClient(app)


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"


def test_baseline_endpoint(client):
    data = client.get("/api/baseline").json()
    assert data["dimensions"] == 3


def test_simulate(client):
    r = client.post("/api/simulate", json={"name": "X", "dimensions": 3})
    assert r.status_code == 200
    assert r.json()["result"]["scorecard"]["life"] is True


def test_simulate_invalid_dimensions(client):
    r = client.post("/api/simulate", json={"dimensions": 9})
    assert r.status_code == 422


def test_whatif_prompt(client):
    r = client.post("/api/whatif", json={"prompt": "what if gravity was 100x stronger"})
    assert r.status_code == 200
    body = r.json()
    assert "narrative" in body
    assert any(d["change"] == "lost" for d in body["milestone_diffs"])


def test_ask(client):
    res = client.post("/api/simulate", json={"dimensions": 4}).json()["result"]
    r = client.post("/api/ask", json={"question": "Why did life fail to emerge?", "result": res})
    assert r.status_code == 200
    assert len(r.json()["suggestions"]) > 0


def test_save_list_get_delete_share(client):
    res = client.post("/api/simulate", json={"name": "Persisted"}).json()["result"]
    saved = client.post("/api/universes", json={"parameters": {"name": "Persisted"}, "result": res}).json()
    uid = saved["id"]

    assert any(u["id"] == uid for u in client.get("/api/universes").json())
    assert client.get(f"/api/universes/{uid}").json()["name"] == "Persisted"

    token = client.post(f"/api/universes/{uid}/share").json()["share_token"]
    assert client.get(f"/api/shared/{token}").json()["id"] == uid

    assert client.delete(f"/api/universes/{uid}").json()["deleted"] is True
    assert client.get(f"/api/universes/{uid}").status_code == 404
