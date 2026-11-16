"""Compression models used by the Section 105.3 browser demo."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, Iterable, List, Sequence, Tuple


DEFAULT_BYTES = [
    42, 42, 42, 42, 43, 43, 43,
    82, 82, 82, 83, 83, 84,
    130, 130, 131, 131, 132,
]


def validate_bytes(values: Iterable[int]) -> List[int]:
    """Return a byte list or raise ValueError for an invalid value."""
    byte_values = list(values)
    if not byte_values:
        raise ValueError("Provide at least one byte.")
    if len(byte_values) > 96:
        raise ValueError("Provide no more than 96 bytes.")
    if any(isinstance(value, bool) or not isinstance(value, int) for value in byte_values):
        raise ValueError("Every byte must be a whole number.")
    if any(value < 0 or value > 255 for value in byte_values):
        raise ValueError("Every byte must be between 0 and 255.")
    return byte_values


def run_length_encode(values: Sequence[int]) -> List[Tuple[int, int]]:
    """Encode consecutive equal bytes as (count, value) pairs."""
    if not values:
        return []
    runs: List[Tuple[int, int]] = []
    current = values[0]
    count = 1
    for value in values[1:]:
        if value == current and count < 255:
            count += 1
        else:
            runs.append((count, current))
            current = value
            count = 1
    runs.append((count, current))
    return runs


def run_length_decode(runs: Sequence[Tuple[int, int]]) -> List[int]:
    """Expand (count, value) pairs into their original byte sequence."""
    return [value for count, value in runs for _ in range(count)]


def quantize(values: Sequence[int], step: int) -> List[int]:
    """Discard precision by mapping bytes to the bottom of fixed-width buckets."""
    if step not in {4, 8, 16, 32, 64}:
        raise ValueError("Quantization step must be 4, 8, 16, 32, or 64.")
    return [(value // step) * step for value in values]


def _run_objects(runs: Sequence[Tuple[int, int]]) -> List[Dict[str, int]]:
    return [{"count": count, "value": value} for count, value in runs]


def _encoded_bytes(runs: Sequence[Tuple[int, int]]) -> List[int]:
    return [component for run in runs for component in run]


def _metrics(original: Sequence[int], decoded: Sequence[int], encoded_size: int) -> Dict[str, Any]:
    changed = [
        index for index, (before, after) in enumerate(zip(original, decoded))
        if before != after
    ]
    original_size = len(original)
    reduction = 100 * (1 - (encoded_size / original_size))
    mean_error = sum(abs(before - after) for before, after in zip(original, decoded)) / original_size
    return {
        "original_bytes": original_size,
        "encoded_bytes": encoded_size,
        "reduction_percent": round(reduction, 1),
        "changed_bytes": len(changed),
        "changed_indices": changed,
        "mean_absolute_error": round(mean_error, 2),
        "exact": not changed,
    }


def build_comparison(values: Iterable[int], quantization_step: int = 16) -> Dict[str, Any]:
    """Build lossless and lossy RLE demonstrations from the same byte stream."""
    original = validate_bytes(values)

    lossless_runs = run_length_encode(original)
    lossless_decoded = run_length_decode(lossless_runs)
    lossless_size = len(lossless_runs) * 2

    quantized = quantize(original, quantization_step)
    lossy_runs = run_length_encode(quantized)
    lossy_decoded = run_length_decode(lossy_runs)
    lossy_size = len(lossy_runs) * 2

    return {
        "original": original,
        "storage_model": "Each RLE run stores one count byte and one value byte.",
        "lossless": {
            "method": "Run-length encoding (RLE)",
            "runs": _run_objects(lossless_runs),
            "encoded": _encoded_bytes(lossless_runs),
            "decoded": lossless_decoded,
            "metrics": _metrics(original, lossless_decoded, lossless_size),
        },
        "lossy": {
            "method": "Byte quantization followed by RLE",
            "quantization_step": quantization_step,
            "quantized": quantized,
            "runs": _run_objects(lossy_runs),
            "encoded": _encoded_bytes(lossy_runs),
            "decoded": lossy_decoded,
            "metrics": _metrics(original, lossy_decoded, lossy_size),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compare lossless and lossy compression of a byte sequence."
    )
    parser.add_argument("bytes", nargs="*", type=int, default=DEFAULT_BYTES)
    parser.add_argument("--step", type=int, default=16)
    args = parser.parse_args()
    print(json.dumps(build_comparison(args.bytes, args.step), indent=2))


if __name__ == "__main__":
    main()
