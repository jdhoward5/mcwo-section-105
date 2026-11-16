"""Four-timestamp NTP exchange model used by the Section 105.5 demo."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict


BASE_TIME_MS = 12 * 60 * 60 * 1000


def _number(value: Any, name: str, minimum: float, maximum: float) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a number.")
    if value < minimum or value > maximum:
        raise ValueError(f"{name} must be between {minimum:g} and {maximum:g} ms.")
    return float(value)


def format_clock(milliseconds: float) -> str:
    """Format milliseconds after midnight as HH:MM:SS.mmm."""
    rounded = int(round(milliseconds)) % (24 * 60 * 60 * 1000)
    hours, remainder = divmod(rounded, 60 * 60 * 1000)
    minutes, remainder = divmod(remainder, 60 * 1000)
    seconds, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{millis:03d}"


def simulate_exchange(
    client_error_ms: float = 240,
    outbound_delay_ms: float = 36,
    server_processing_ms: float = 4,
    inbound_delay_ms: float = 36,
) -> Dict[str, Any]:
    """Simulate one NTP exchange and estimate the client clock correction."""
    client_error = _number(client_error_ms, "client_error_ms", -1000, 1000)
    outbound = _number(outbound_delay_ms, "outbound_delay_ms", 0, 500)
    processing = _number(server_processing_ms, "server_processing_ms", 0, 100)
    inbound = _number(inbound_delay_ms, "inbound_delay_ms", 0, 500)

    # The server is the reference clock. The client's timestamps include its error.
    t1 = BASE_TIME_MS + client_error
    t2 = BASE_TIME_MS + outbound
    t3 = BASE_TIME_MS + outbound + processing
    t4 = BASE_TIME_MS + outbound + processing + inbound + client_error

    round_trip_delay = (t4 - t1) - (t3 - t2)
    estimated_correction = ((t2 - t1) + (t3 - t4)) / 2
    actual_correction = -client_error
    residual_error = client_error + estimated_correction
    asymmetry = outbound - inbound

    timestamps = [
        {
            "id": "T1",
            "label": "Client sends request",
            "clock": "client",
            "milliseconds": t1,
            "display": format_clock(t1),
        },
        {
            "id": "T2",
            "label": "Server receives request",
            "clock": "server",
            "milliseconds": t2,
            "display": format_clock(t2),
        },
        {
            "id": "T3",
            "label": "Server sends response",
            "clock": "server",
            "milliseconds": t3,
            "display": format_clock(t3),
        },
        {
            "id": "T4",
            "label": "Client receives response",
            "clock": "client",
            "milliseconds": t4,
            "display": format_clock(t4),
        },
    ]

    return {
        "inputs": {
            "client_error_ms": client_error,
            "outbound_delay_ms": outbound,
            "server_processing_ms": processing,
            "inbound_delay_ms": inbound,
        },
        "timestamps": timestamps,
        "calculation": {
            "round_trip_delay_ms": round(round_trip_delay, 3),
            "estimated_correction_ms": round(estimated_correction, 3),
            "actual_correction_ms": round(actual_correction, 3),
            "residual_error_ms": round(residual_error, 3),
            "path_asymmetry_ms": round(asymmetry, 3),
            "t2_minus_t1_ms": round(t2 - t1, 3),
            "t3_minus_t4_ms": round(t3 - t4, 3),
        },
        "result": {
            "before_error_ms": round(client_error, 3),
            "after_error_ms": round(residual_error, 3),
            "estimate_exact": abs(residual_error) < 0.0005,
            "quality": "Exact under symmetric delay" if abs(residual_error) < 0.0005 else "Biased by path asymmetry",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Simulate a four-timestamp NTP exchange.")
    parser.add_argument("--client-error", type=float, default=240)
    parser.add_argument("--outbound", type=float, default=36)
    parser.add_argument("--processing", type=float, default=4)
    parser.add_argument("--inbound", type=float, default=36)
    args = parser.parse_args()
    print(
        json.dumps(
            simulate_exchange(
                args.client_error,
                args.outbound,
                args.processing,
                args.inbound,
            ),
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
