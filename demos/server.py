"""Dependency-free development server for the MCWO Section 105 demos."""

from __future__ import annotations

import argparse
import importlib
import json
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict
from notes import read_topic


PROJECT_ROOT = Path(__file__).resolve().parent
SITE_ROOT = PROJECT_ROOT / "site"
pipeline_105_2 = importlib.import_module("105_2").build_pipeline
pipeline_105_3 = importlib.import_module("105_3").build_comparison
pipeline_105_4 = importlib.import_module("105_4").build_round_trip
pipeline_105_5 = importlib.import_module("105_5").simulate_exchange
pipeline_105_7 = importlib.import_module("105_7").build_compilation
pipeline_105_8_trace = importlib.import_module("105_8").build_request_trace
pipeline_105_8_memory = importlib.import_module("105_8").build_memory_model
pipeline_105_9_stack = importlib.import_module("105_9").build_stack
pipeline_105_9_cluster = importlib.import_module("105_9").reconcile_cluster
pipeline_105_10 = importlib.import_module("105_10").analyze_virtualization


class DemoHandler(SimpleHTTPRequestHandler):
    """Serve the frontend and the small APIs used by interactive demos."""

    protocol_version = "HTTP/1.1"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(SITE_ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        if self.path.startswith("/api/notes/"):
            try:
                self._send_json(read_topic(self.path.removeprefix("/api/notes/")))
            except KeyError:
                self._send_json({"error": "This topic has no reference notes."}, HTTPStatus.NOT_FOUND)
            except (OSError, UnicodeError):
                self._send_json({"error": "The local reference notes could not be read."}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        if self.path == "/api/health":
            self._send_json({"status": "ok"})
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        if self.path not in {
            "/api/105-2/encode",
            "/api/105-3/compress",
            "/api/105-4/serialize",
            "/api/105-5/simulate",
            "/api/105-7/compile",
            "/api/105-8/trace",
            "/api/105-8/memory",
            "/api/105-9/stack",
            "/api/105-9/cluster",
            "/api/105-10/analyze",
        }:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length > 16_384:
                raise ValueError("Request is too large.")
            payload = json.loads(self.rfile.read(content_length) or b"{}")
            if self.path == "/api/105-2/encode":
                message = payload.get("message", "")
                if not isinstance(message, str):
                    raise ValueError("message must be a string.")
                if len(message) > 4_096:
                    raise ValueError("message must be 4,096 characters or fewer.")
                self._send_json(pipeline_105_2(message))
                return

            if self.path == "/api/105-3/compress":
                values = payload.get("bytes", [])
                if not isinstance(values, list):
                    raise ValueError("bytes must be a list.")
                quantization_step = payload.get("quantization_step", 16)
                if isinstance(quantization_step, bool) or not isinstance(quantization_step, int):
                    raise ValueError("quantization_step must be a whole number.")
                self._send_json(pipeline_105_3(values, quantization_step))
                return

            if self.path == "/api/105-4/serialize":
                record = payload.get("record", {})
                if not isinstance(record, dict):
                    raise ValueError("record must be an object.")
                self._send_json(pipeline_105_4(record))
                return

            if self.path == "/api/105-7/compile":
                self._send_json(
                    pipeline_105_7(
                        payload.get("example", "add"),
                        payload.get("architecture", "x86_64"),
                        payload.get("optimization", "O2"),
                        payload.get("inputs"),
                    )
                )
                return

            if self.path == "/api/105-8/trace":
                self._send_json(
                    pipeline_105_8_trace(
                        payload.get("scenario", "file"),
                        payload.get("access_granted", True),
                    )
                )
                return

            if self.path == "/api/105-8/memory":
                self._send_json(
                    pipeline_105_8_memory(
                        payload.get("memory_pressure", 35),
                        payload.get("working_set_pages", 5),
                    )
                )
                return

            if self.path == "/api/105-9/stack":
                self._send_json(pipeline_105_9_stack(payload.get("stack_type", "type1")))
                return

            if self.path == "/api/105-9/cluster":
                self._send_json(
                    pipeline_105_9_cluster(
                        payload.get("desired_replicas", 3),
                        payload.get("failed_hosts", []),
                        payload.get("crashed_replica"),
                    )
                )
                return

            if self.path == "/api/105-10/analyze":
                self._send_json(
                    pipeline_105_10(
                        payload.get("workloads", 4),
                        payload.get("demand_percent", 20),
                        payload.get("virtual_hosts", 2),
                        payload.get("scenario", "steady"),
                        payload.get("recovery_enabled", True),
                    )
                )
                return

            self._send_json(
                pipeline_105_5(
                    payload.get("client_error_ms", 240),
                    payload.get("outbound_delay_ms", 36),
                    payload.get("server_processing_ms", 4),
                    payload.get("inbound_delay_ms", 36),
                )
            )
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            self._send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def _send_json(
        self, payload: Dict[str, Any], status: HTTPStatus = HTTPStatus.OK
    ) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), DemoHandler)
    print(f"MCWO demos available at http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping demo server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
