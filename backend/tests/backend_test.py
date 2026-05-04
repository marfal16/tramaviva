"""Backend tests for Trama Viva APS API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nodi-vivi.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- Root --------
class TestRoot:
    def test_root_returns_tagline(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("tagline") == "Ogni filo conta"
        assert "message" in data


# -------- Events --------
class TestEvents:
    def test_list_events(self, client):
        r = client.get(f"{API}/events")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 6
        required = {"id", "title", "category", "date", "time", "location", "description", "emoji", "spots"}
        for ev in data:
            assert required.issubset(ev.keys())
            assert "_id" not in ev
            assert isinstance(ev["spots"], int)

    def test_get_event_by_id(self, client):
        r = client.get(f"{API}/events/evt-aperi-01")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == "evt-aperi-01"
        assert data["title"] == "Aperitivo di Benvenuto"
        assert "_id" not in data

    def test_get_event_invalid_id(self, client):
        r = client.get(f"{API}/events/does-not-exist")
        assert r.status_code == 404


# -------- Event Signup --------
class TestEventSignup:
    def test_valid_signup(self, client):
        payload = {
            "event_id": "evt-aperi-01",
            "event_title": "Aperitivo di Benvenuto",
            "name": "TEST_Mario Rossi",
            "email": "test_mario@example.com",
            "phone": "+39123456789",
            "message": "Ciao!",
        }
        r = client.post(f"{API}/event-signup", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert data["event_id"] == payload["event_id"]
        assert data["email"] == payload["email"]
        assert "_id" not in data

    def test_invalid_email(self, client):
        payload = {
            "event_id": "evt-aperi-01",
            "event_title": "X",
            "name": "X",
            "email": "not-an-email",
        }
        r = client.post(f"{API}/event-signup", json=payload)
        assert r.status_code == 422

    def test_missing_required(self, client):
        r = client.post(f"{API}/event-signup", json={"email": "a@b.com"})
        assert r.status_code == 422


# -------- Membership --------
class TestMembership:
    def test_valid_membership(self, client):
        payload = {
            "first_name": "TEST_Luca",
            "last_name": "Verdi",
            "email": "test_luca@example.com",
            "phone": "+39111",
            "city": "Milano",
            "motivation": "perché sì",
        }
        r = client.post(f"{API}/membership", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert data["first_name"] == payload["first_name"]
        assert data["email"] == payload["email"]
        assert "_id" not in data

    def test_missing_required(self, client):
        r = client.post(f"{API}/membership", json={"first_name": "X"})
        assert r.status_code == 422

    def test_invalid_email(self, client):
        r = client.post(f"{API}/membership", json={
            "first_name": "a", "last_name": "b", "email": "bademail",
        })
        assert r.status_code == 422


# -------- Contact --------
class TestContact:
    def test_valid_contact(self, client):
        payload = {
            "name": "TEST_Sara",
            "email": "test_sara@example.com",
            "message": "Hello world",
        }
        r = client.post(f"{API}/contact", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert data["message"] == payload["message"]
        assert "_id" not in data

    def test_invalid_email(self, client):
        r = client.post(f"{API}/contact", json={
            "name": "a", "email": "not-email", "message": "hi"
        })
        assert r.status_code == 422

    def test_missing_message(self, client):
        r = client.post(f"{API}/contact", json={"name": "a", "email": "a@b.com"})
        assert r.status_code == 422
