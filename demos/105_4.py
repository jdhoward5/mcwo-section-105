"""JSON serialization model used by the Section 105.4 browser demo."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict


DEFAULT_RECORD = {
    "name": "Avery",
    "clearance": 3,
    "active": True,
    "roles": ["analyst", "operator"],
    "note": None,
}


def json_type(value: Any) -> str:
    """Return the JSON data type name for a Python value."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, str):
        return "string"
    if isinstance(value, (int, float)):
        return "number"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    raise ValueError(f"Unsupported value type: {type(value).__name__}.")


def type_shape(value: Any) -> Any:
    """Describe nested JSON types so round-trip verification includes type identity."""
    value_type = json_type(value)
    if value_type == "object":
        return {key: type_shape(item) for key, item in value.items()}
    if value_type == "array":
        return [type_shape(item) for item in value]
    return value_type


def build_round_trip(record: Dict[str, Any]) -> Dict[str, Any]:
    """Serialize a JSON-compatible mapping and then reconstruct it."""
    if not isinstance(record, dict):
        raise ValueError("record must be an object.")
    if not record:
        raise ValueError("record must contain at least one field.")

    try:
        serialized = json.dumps(
            record,
            ensure_ascii=False,
            separators=(",", ":"),
            allow_nan=False,
        )
        pretty = json.dumps(record, ensure_ascii=False, indent=2, allow_nan=False)
    except (TypeError, ValueError) as error:
        raise ValueError(f"record is not JSON serializable: {error}") from error

    encoded = serialized.encode("utf-8")
    restored = json.loads(encoded.decode("utf-8"))
    original_shape = type_shape(record)
    restored_shape = type_shape(restored)

    return {
        "original": record,
        "types": {key: json_type(value) for key, value in record.items()},
        "serialized": serialized,
        "pretty": pretty,
        "utf8": {
            "decimal": list(encoded),
            "hex": [f"{byte:02X}" for byte in encoded],
            "byte_count": len(encoded),
        },
        "restored": restored,
        "metrics": {
            "fields": len(record),
            "json_characters": len(serialized),
            "utf8_bytes": len(encoded),
            "exact": record == restored and original_shape == restored_shape,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Serialize a JSON record, encode it as UTF-8, and reconstruct it."
    )
    parser.add_argument(
        "record",
        nargs="?",
        default=json.dumps(DEFAULT_RECORD),
        help="A JSON object.",
    )
    args = parser.parse_args()
    parsed = json.loads(args.record)
    print(json.dumps(build_round_trip(parsed), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
