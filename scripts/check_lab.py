"""Smoke-check a running lab, including files needed in a release or container."""

import argparse
import json
import time
from urllib.error import URLError
from urllib.request import Request, urlopen


def check(base_url):
    def get(path, payload=None):
        request = Request(
            base_url.rstrip("/") + path,
            data=None if payload is None else json.dumps(payload).encode(),
            headers={} if payload is None else {"Content-Type": "application/json"},
        )
        with urlopen(request, timeout=5) as response:
            assert response.status == 200, path
            body = response.read()
            assert body, path
            return body

    for attempt in range(30):
        try:
            assert json.loads(get("/api/health"))["status"] == "ok"
            break
        except (URLError, TimeoutError, ConnectionError):
            if attempt == 29:
                raise
            time.sleep(1)

    for path in (
        "/", "/app.js", "/notes.js", "/styles.css", "/paper-ink.css",
        "/fonts/SourceSans3-Variable.ttf", "/fonts/SourceSans3-Italic-Variable.ttf",
        "/fonts/SourceSans3-OFL.txt",
    ):
        get(path)

    for number in range(1, 29):
        notes = json.loads(get(f"/api/notes/105-{number}"))
        assert notes["id"] == f"105-{number}"
        assert notes["markdown"].strip()
        if number >= 2:
            get(f"/demos/105-{number}.js")

    routes = {
        "105-2/encode": {"message": "Information Lab"},
        "105-3/compress": {"bytes": [65, 65, 65, 66], "quantization_step": 16},
        "105-4/serialize": {"record": {"name": "Lab", "count": 2}},
        "105-5/simulate": {},
        "105-7/compile": {},
        "105-8/trace": {},
        "105-8/memory": {},
        "105-9/stack": {},
        "105-9/cluster": {},
        "105-10/analyze": {},
    }
    for route, payload in routes.items():
        result = json.loads(get(f"/api/{route}", payload))
        assert isinstance(result, dict) and "error" not in result, route
    print("Passed: static assets, 28 notes, 27 demo modules, and 10 API routes.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:8000")
    check(parser.parse_args().url)
