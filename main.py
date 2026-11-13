

from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl
import secrets
import string
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# Static frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")


# PostgreSQL connection dependency
def get_db_connection():
    conn = None

    try:
        conn = psycopg2.connect(
            os.environ["DATABASE_URL"],
            connect_timeout=10
        )

        yield conn

        conn.commit()

    except Exception:
        if conn is not None:
            conn.rollback()
        raise

    finally:
        if conn is not None:
            conn.close()


# Request format
class URLRequest(BaseModel):
    url: HttpUrl


# Home page
@app.get("/")
def home():
    return FileResponse("static/index.html")


# Shorten URL
@app.post("/shorten")
def shorten_url(
    request: URLRequest,
    conn=Depends(get_db_connection)
):
    characters = string.ascii_letters + string.digits

    while True:
        short_code = ''.join(
            secrets.choice(characters) for _ in range(7)
        )

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO urls (short_code, original_url, created_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (short_code) DO NOTHING
                RETURNING id
                """,
                (short_code, str(request.url))
            )

            result = cur.fetchone()

        if result:
            break

    short_url = f"{BASE_URL}/{short_code}"

    return {
        "original_url": str(request.url),
        "short_code": short_code,
        "short_url": short_url
    }


# Redirect and record clicks
@app.get("/{short_code}")
def redirect_url(
    short_code: str,
    conn=Depends(get_db_connection)
):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, original_url
            FROM urls
            WHERE short_code = %s
            """,
            (short_code,)
        )

        result = cur.fetchone()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    url_id, original_url = result

    # Record click
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO clicks (url_id)
            VALUES (%s)
            """,
            (url_id,)
        )

    return RedirectResponse(
        url=original_url,
        status_code=307
    )


# URL Analytics
@app.get("/analytics/{short_code}")
def get_analytics(
    short_code: str,
    conn=Depends(get_db_connection)
):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, original_url
            FROM urls
            WHERE short_code = %s
            """,
            (short_code,)
        )

        result = cur.fetchone()

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Short URL not found"
        )

    url_id, original_url = result

    # Get click history
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT clicked_at
            FROM clicks
            WHERE url_id = %s
            ORDER BY clicked_at
            """,
            (url_id,)
        )

        clicks = cur.fetchall()

    return {
        "short_code": short_code,
        "original_url": original_url,
        "total_clicks": len(clicks),
        "click_history": [
            click[0].isoformat() for click in clicks
        ]
    }
