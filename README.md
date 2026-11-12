# Linkly – URL Shortener with Click Analytics

A URL shortener built using **Python, FastAPI, and PostgreSQL**, featuring URL redirection, persistent storage, and click analytics through a modern web interface.

## Features

- Generate unique 7-character short URLs.
- Redirect users to their original URLs.
- Store URLs permanently using PostgreSQL.
- Track every click on a shortened URL.
- View total clicks and click history.
- Browse recently shortened URLs.
- Copy shortened URLs with one click.
- Automated backend testing using Pytest.

## Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| FastAPI | REST API development |
| PostgreSQL | Database |
| Psycopg2 | Database connectivity |
| HTML, CSS, JavaScript | Frontend |
| Pytest | Automated testing |
| Git & GitHub | Version control |

## Project Structure

```text
url-shortener-click-analytics/
│
├── main.py
├── databases.py
├── requirements.txt
├── .gitignore
│
├── static/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── tests/
    ├── conftest.py
    └── test_main.py
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/chughaarush/url-shortener-click-analytics.git
cd url-shortener-click-analytics
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_NAME=url_shortener
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
```

Replace `your_password` with your local PostgreSQL password.

### 5. Set up the database

Create a PostgreSQL database named `url_shortener` and execute:

```sql
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(7) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Run the application

```bash
python -m uvicorn main:app --reload
```

Open your browser at:

`http://127.0.0.1:8000`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/shorten` | Generate a short URL |
| GET | `/{short_code}` | Redirect to original URL |
| GET | `/analytics/{short_code}` | Retrieve click analytics |

## Running Tests

Run the automated test suite:

```bash
pytest -v
```

The project currently includes **7 passing tests** covering URL shortening, unique codes, redirection, analytics, click tracking, and invalid requests.

## Future Improvements

- Deploy the application online.
- Add user authentication.
- Introduce advanced click analytics.
- Add custom short URL aliases.

## Author

**Aarush Chugh**

B.Tech Computer Science Engineering

[GitHub](https://github.com/chughaarush)

---

*Built as a hands-on backend development project to strengthen my understanding of APIs, databases, and software testing.*