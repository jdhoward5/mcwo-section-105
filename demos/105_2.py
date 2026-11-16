"""Data transformations used by the Section 105.2 browser demo."""

from __future__ import annotations

import argparse
import base64
import json
import textwrap
from typing import Any, Dict


def build_pipeline(message: str) -> Dict[str, Any]:
    """Return each representation produced while preparing text for email."""
    utf8_bytes = message.encode("utf-8")
    encoded = base64.b64encode(utf8_bytes).decode("ascii")
    wrapped_body = "\r\n".join(textwrap.wrap(encoded, width=76))
    mime_message = (
        "MIME-Version: 1.0\r\n"
        "Content-Type: text/plain; charset=UTF-8\r\n"
        "Content-Transfer-Encoding: base64\r\n"
        "\r\n"
        f"{wrapped_body}"
    )
    decoded = base64.b64decode(encoded).decode("utf-8")

    return {
        "original": message,
        "utf8": {
            "decimal": list(utf8_bytes),
            "hex": " ".join(f"{byte:02X}" for byte in utf8_bytes),
            "bits": " ".join(f"{byte:08b}" for byte in utf8_bytes),
        },
        "base64": encoded,
        "mime": mime_message,
        "decoded": decoded,
        "metrics": {
            "characters": len(message),
            "utf8_bytes": len(utf8_bytes),
            "base64_characters": len(encoded),
            "mime_bytes": len(mime_message.encode("utf-8")),
            "round_trip_exact": decoded == message,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Show the encoding stages used by the Section 105.2 demo."
    )
    parser.add_argument("message", nargs="?", default="Hello, Bob! 📷")
    args = parser.parse_args()
    print(json.dumps(build_pipeline(args.message), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
