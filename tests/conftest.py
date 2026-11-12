import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import os
import pytest
from fastapi.testclient import TestClient

# Always use the testing database
os.environ["DB_NAME"] = "url_shortener_test"

from main import app, conn


@pytest.fixture(scope="session")
def client():
    with TestClient(app, follow_redirects=False) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_database():

    with conn.cursor() as cur:
        cur.execute(
            "TRUNCATE TABLE clicks, urls RESTART IDENTITY CASCADE"
        )

    conn.commit()

    yield
