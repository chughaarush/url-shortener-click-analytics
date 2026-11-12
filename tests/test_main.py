
# Test 1: Check whether URL shortening works

def test_shorten_url(client):

    response = client.post(
        "/shorten",
        json={"url": "https://www.google.com"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["original_url"].startswith("https://www.google.com")
    assert len(data["short_code"]) == 7
    assert data["short_url"].endswith(data["short_code"])


# Test 2: Check whether generated codes are unique

def test_unique_short_codes(client):

    response1 = client.post(
        "/shorten",
        json={"url": "https://www.google.com"}
    )

    response2 = client.post(
        "/shorten",
        json={"url": "https://www.youtube.com"}
    )

    code1 = response1.json()["short_code"]
    code2 = response2.json()["short_code"]

    assert code1 != code2


# Test 3: Check whether redirection works

def test_redirect_url(client):

    response = client.post(
        "/shorten",
        json={"url": "https://www.google.com"}
    )

    code = response.json()["short_code"]

    redirect_response = client.get(f"/{code}")

    assert redirect_response.status_code == 307
    assert redirect_response.headers["location"].startswith("https://www.google.com")


# Test 4: Check analytics for a newly created URL

def test_analytics(client):

    response = client.post(
        "/shorten",
        json={"url": "https://www.google.com"}
    )

    code = response.json()["short_code"]

    analytics_response = client.get(f"/analytics/{code}")

    assert analytics_response.status_code == 200

    data = analytics_response.json()

    assert data["total_clicks"] == 0
    assert data["short_code"] == code


# Test 5: Check whether clicks are recorded

def test_click_tracking(client):

    response = client.post(
        "/shorten",
        json={"url": "https://www.google.com"}
    )

    code = response.json()["short_code"]

    # Visit the shortened URL
    client.get(f"/{code}")

    # Check analytics
    analytics_response = client.get(f"/analytics/{code}")

    data = analytics_response.json()

    assert data["total_clicks"] == 1
    assert len(data["click_history"]) == 1


# Test 6: Check invalid short code

def test_invalid_short_code(client):

    response = client.get("/invalid123")

    assert response.status_code == 404


# Test 7: Check analytics for invalid short code

def test_invalid_analytics(client):

    response = client.get("/analytics/invalid123")

    assert response.status_code == 404
