"""Deterministic CPU compilation examples for the Section 105.7 demo."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, Iterable, List


EXAMPLES = {
    "add": {
        "title": "Add two integers",
        "concept": "Arithmetic",
        "source": "int add(int a, int b) {\n    return a + b;\n}",
        "defaults": [7, 5],
        "labels": ["a", "b"],
    },
    "absolute": {
        "title": "Choose an absolute value",
        "concept": "Conditional move",
        "source": "int absolute(int value) {\n    return value < 0 ? -value : value;\n}",
        "defaults": [-12],
        "labels": ["value"],
    },
    "sum3": {
        "title": "Read three array elements",
        "concept": "Memory addressing",
        "source": "int sum3(const int *values) {\n    return values[0] + values[1] + values[2];\n}",
        "defaults": [4, 8, 15],
        "labels": ["values[0]", "values[1]", "values[2]"],
    },
}


ARCHITECTURES = {
    "i386": {
        "label": "x86 · 32-bit",
        "target": "i386-apple-macos13",
        "format": "Mach-O 32-bit i386",
        "register_note": "32-bit registers use names such as EAX and ESP. In these examples, function arguments arrive on the stack.",
    },
    "x86_64": {
        "label": "x86-64 · 64-bit",
        "target": "x86_64-apple-macos13",
        "format": "Mach-O 64-bit x86-64",
        "register_note": "x86-64 adds 64-bit registers such as RAX and RDI. This calling convention passes early arguments in registers.",
    },
    "arm64": {
        "label": "Arm64 · 64-bit RISC",
        "target": "arm64-apple-macos13",
        "format": "Mach-O 64-bit arm64",
        "register_note": "AArch64 uses 64-bit X registers and their 32-bit W views. This calling convention passes early arguments in X0–X7 or W0–W7.",
    },
}


def _instructions(rows: Iterable[str]) -> List[Dict[str, str]]:
    instructions = []
    for row in rows:
        offset, byte_string, assembly = row.split("|", 2)
        mnemonic = assembly.split()[0]
        explanations = {
            "movl": "Copy a 32-bit value between a register and memory.",
            "movq": "Copy a 64-bit value between a register and memory.",
            "leal": "Compute an address expression; here it performs addition without a memory read.",
            "addl": "Add a 32-bit source value to the destination.",
            "cmpl": "Compare two 32-bit values and set status flags.",
            "jge": "Jump when the signed comparison is greater than or equal.",
            "jmp": "Continue execution at another instruction address.",
            "xorl": "Exclusive-OR; using a register with itself produces zero.",
            "subl": "Subtract the source from the 32-bit destination.",
            "negl": "Replace a signed integer with its two's-complement negation.",
            "cmovsl": "Copy only when the sign flag is set, avoiding a branch.",
            "pushl": "Place a 32-bit value on the stack.",
            "popl": "Remove a 32-bit value from the stack.",
            "retl": "Return to the 32-bit caller.",
            "retq": "Return to the 64-bit caller.",
            "add": "Add register operands and place the result in the destination register.",
            "sub": "Subtract an immediate value; here it reserves stack space.",
            "str": "Store a register value into memory.",
            "ldr": "Load a value from memory into a register.",
            "ldp": "Load a pair of registers from adjacent memory locations.",
            "cmp": "Compare operands and set condition flags.",
            "cneg": "Conditionally negate a register value without branching.",
            "tbz": "Test one bit and branch when that bit is zero.",
            "b": "Branch unconditionally to another instruction.",
            "mov": "Copy or synthesize a value in a register.",
            "subs": "Subtract operands and set condition flags.",
            "ret": "Return to the AArch64 caller.",
        }
        instructions.append(
            {
                "offset": offset,
                "bytes": byte_string,
                "assembly": assembly,
                "explanation": explanations.get(mnemonic, "Execute an x86 instruction."),
            }
        )
    return instructions


# Captured from Apple clang 21.0.0 with -fomit-frame-pointer. Padding between
# functions is omitted because it is not part of the selected function.
COMPILED = {
    ("add", "i386", "O0"): _instructions([
        "00|8b 44 24 08|movl  0x8(%esp), %eax",
        "04|8b 44 24 04|movl  0x4(%esp), %eax",
        "08|8b 44 24 04|movl  0x4(%esp), %eax",
        "0c|03 44 24 08|addl  0x8(%esp), %eax",
        "10|c3|retl",
    ]),
    ("add", "i386", "O2"): _instructions([
        "00|8b 44 24 08|movl  0x8(%esp), %eax",
        "04|03 44 24 04|addl  0x4(%esp), %eax",
        "08|c3|retl",
    ]),
    ("add", "x86_64", "O0"): _instructions([
        "00|89 7c 24 fc|movl  %edi, -0x4(%rsp)",
        "04|89 74 24 f8|movl  %esi, -0x8(%rsp)",
        "08|8b 44 24 fc|movl  -0x4(%rsp), %eax",
        "0c|03 44 24 f8|addl  -0x8(%rsp), %eax",
        "10|c3|retq",
    ]),
    ("add", "x86_64", "O2"): _instructions([
        "00|8d 04 37|leal  (%rdi,%rsi), %eax",
        "03|c3|retq",
    ]),
    ("absolute", "i386", "O0"): _instructions([
        "00|50|pushl  %eax",
        "01|8b 44 24 08|movl  0x8(%esp), %eax",
        "05|83 7c 24 08 00|cmpl  $0x0, 0x8(%esp)",
        "0a|7d 0b|jge  0x17",
        "0c|31 c0|xorl  %eax, %eax",
        "0e|2b 44 24 08|subl  0x8(%esp), %eax",
        "12|89 04 24|movl  %eax, (%esp)",
        "15|eb 07|jmp  0x1e",
        "17|8b 44 24 08|movl  0x8(%esp), %eax",
        "1b|89 04 24|movl  %eax, (%esp)",
        "1e|8b 04 24|movl  (%esp), %eax",
        "21|59|popl  %ecx",
        "22|c3|retl",
    ]),
    ("absolute", "i386", "O2"): _instructions([
        "00|8b 4c 24 04|movl  0x4(%esp), %ecx",
        "04|89 c8|movl  %ecx, %eax",
        "06|f7 d8|negl  %eax",
        "08|0f 48 c1|cmovsl  %ecx, %eax",
        "0b|c3|retl",
    ]),
    ("absolute", "x86_64", "O0"): _instructions([
        "00|89 7c 24 fc|movl  %edi, -0x4(%rsp)",
        "04|83 7c 24 fc 00|cmpl  $0x0, -0x4(%rsp)",
        "09|7d 0c|jge  0x17",
        "0b|31 c0|xorl  %eax, %eax",
        "0d|2b 44 24 fc|subl  -0x4(%rsp), %eax",
        "11|89 44 24 f8|movl  %eax, -0x8(%rsp)",
        "15|eb 08|jmp  0x1f",
        "17|8b 44 24 fc|movl  -0x4(%rsp), %eax",
        "1b|89 44 24 f8|movl  %eax, -0x8(%rsp)",
        "1f|8b 44 24 f8|movl  -0x8(%rsp), %eax",
        "23|c3|retq",
    ]),
    ("absolute", "x86_64", "O2"): _instructions([
        "00|89 f8|movl  %edi, %eax",
        "02|f7 d8|negl  %eax",
        "04|0f 48 c7|cmovsl  %edi, %eax",
        "07|c3|retq",
    ]),
    ("sum3", "i386", "O0"): _instructions([
        "00|8b 44 24 04|movl  0x4(%esp), %eax",
        "04|8b 44 24 04|movl  0x4(%esp), %eax",
        "08|8b 00|movl  (%eax), %eax",
        "0a|8b 4c 24 04|movl  0x4(%esp), %ecx",
        "0e|03 41 04|addl  0x4(%ecx), %eax",
        "11|8b 4c 24 04|movl  0x4(%esp), %ecx",
        "15|03 41 08|addl  0x8(%ecx), %eax",
        "18|c3|retl",
    ]),
    ("sum3", "i386", "O2"): _instructions([
        "00|8b 4c 24 04|movl  0x4(%esp), %ecx",
        "04|8b 41 04|movl  0x4(%ecx), %eax",
        "07|03 01|addl  (%ecx), %eax",
        "09|03 41 08|addl  0x8(%ecx), %eax",
        "0c|c3|retl",
    ]),
    ("sum3", "x86_64", "O0"): _instructions([
        "00|48 89 7c 24 f8|movq  %rdi, -0x8(%rsp)",
        "05|48 8b 44 24 f8|movq  -0x8(%rsp), %rax",
        "0a|8b 00|movl  (%rax), %eax",
        "0c|48 8b 4c 24 f8|movq  -0x8(%rsp), %rcx",
        "11|03 41 04|addl  0x4(%rcx), %eax",
        "14|48 8b 4c 24 f8|movq  -0x8(%rsp), %rcx",
        "19|03 41 08|addl  0x8(%rcx), %eax",
        "1c|c3|retq",
    ]),
    ("sum3", "x86_64", "O2"): _instructions([
        "00|8b 47 04|movl  0x4(%rdi), %eax",
        "03|03 07|addl  (%rdi), %eax",
        "05|03 47 08|addl  0x8(%rdi), %eax",
        "08|c3|retq",
    ]),
    ("add", "arm64", "O0"): _instructions([
        "00|ff 43 00 d1|sub  sp, sp, #0x10",
        "04|e0 0f 00 b9|str  w0, [sp, #0xc]",
        "08|e1 0b 00 b9|str  w1, [sp, #0x8]",
        "0c|e8 0f 40 b9|ldr  w8, [sp, #0xc]",
        "10|e9 0b 40 b9|ldr  w9, [sp, #0x8]",
        "14|00 01 09 0b|add  w0, w8, w9",
        "18|ff 43 00 91|add  sp, sp, #0x10",
        "1c|c0 03 5f d6|ret",
    ]),
    ("add", "arm64", "O2"): _instructions([
        "00|20 00 00 0b|add  w0, w1, w0",
        "04|c0 03 5f d6|ret",
    ]),
    ("absolute", "arm64", "O0"): _instructions([
        "00|ff 43 00 d1|sub  sp, sp, #0x10",
        "04|e0 0f 00 b9|str  w0, [sp, #0xc]",
        "08|e8 0f 40 b9|ldr  w8, [sp, #0xc]",
        "0c|e8 00 f8 36|tbz  w8, #0x1f, 0x28",
        "10|01 00 00 14|b  0x14",
        "14|e9 0f 40 b9|ldr  w9, [sp, #0xc]",
        "18|08 00 80 52|mov  w8, #0x0",
        "1c|08 01 09 6b|subs  w8, w8, w9",
        "20|e8 0b 00 b9|str  w8, [sp, #0x8]",
        "24|04 00 00 14|b  0x34",
        "28|e8 0f 40 b9|ldr  w8, [sp, #0xc]",
        "2c|e8 0b 00 b9|str  w8, [sp, #0x8]",
        "30|01 00 00 14|b  0x34",
        "34|e0 0b 40 b9|ldr  w0, [sp, #0x8]",
        "38|ff 43 00 91|add  sp, sp, #0x10",
        "3c|c0 03 5f d6|ret",
    ]),
    ("absolute", "arm64", "O2"): _instructions([
        "00|1f 00 00 71|cmp  w0, #0x0",
        "04|00 54 80 5a|cneg  w0, w0, mi",
        "08|c0 03 5f d6|ret",
    ]),
    ("sum3", "arm64", "O0"): _instructions([
        "00|ff 43 00 d1|sub  sp, sp, #0x10",
        "04|e0 07 00 f9|str  x0, [sp, #0x8]",
        "08|e8 07 40 f9|ldr  x8, [sp, #0x8]",
        "0c|08 01 40 b9|ldr  w8, [x8]",
        "10|e9 07 40 f9|ldr  x9, [sp, #0x8]",
        "14|29 05 40 b9|ldr  w9, [x9, #0x4]",
        "18|08 01 09 0b|add  w8, w8, w9",
        "1c|e9 07 40 f9|ldr  x9, [sp, #0x8]",
        "20|29 09 40 b9|ldr  w9, [x9, #0x8]",
        "24|00 01 09 0b|add  w0, w8, w9",
        "28|ff 43 00 91|add  sp, sp, #0x10",
        "2c|c0 03 5f d6|ret",
    ]),
    ("sum3", "arm64", "O2"): _instructions([
        "00|08 24 40 29|ldp  w8, w9, [x0]",
        "04|0a 08 40 b9|ldr  w10, [x0, #0x8]",
        "08|28 01 08 0b|add  w8, w9, w8",
        "0c|00 01 0a 0b|add  w0, w8, w10",
        "10|c0 03 5f d6|ret",
    ]),
}


def _integer(value: Any, label: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{label} must be an integer.")
    if value < -999 or value > 999:
        raise ValueError(f"{label} must be between -999 and 999.")
    return value


def build_compilation(
    example: str = "add",
    architecture: str = "x86_64",
    optimization: str = "O2",
    inputs: Any = None,
) -> Dict[str, Any]:
    """Return a captured compilation and evaluate its example inputs."""
    if example not in EXAMPLES:
        raise ValueError("example must be add, absolute, or sum3.")
    if architecture not in ARCHITECTURES:
        raise ValueError("architecture must be i386, x86_64, or arm64.")
    if optimization not in {"O0", "O2"}:
        raise ValueError("optimization must be O0 or O2.")

    definition = EXAMPLES[example]
    values = definition["defaults"] if inputs is None else inputs
    if not isinstance(values, list) or len(values) != len(definition["labels"]):
        raise ValueError(f"inputs must contain {len(definition['labels'])} integer value(s).")
    values = [_integer(value, label) for value, label in zip(values, definition["labels"])]

    if example == "add":
        result = values[0] + values[1]
        call = f"add({values[0]}, {values[1]})"
    elif example == "absolute":
        result = abs(values[0])
        call = f"absolute({values[0]})"
    else:
        result = sum(values)
        call = f"sum3({{{', '.join(map(str, values))}}})"

    instructions = COMPILED[(example, architecture, optimization)]
    byte_count = sum(len(instruction["bytes"].split()) for instruction in instructions)
    arch = ARCHITECTURES[architecture]
    return {
        "example": {**definition, "id": example, "inputs": values},
        "architecture": {**arch, "id": architecture},
        "optimization": optimization,
        "compiler": {
            "name": "Apple clang 21.0.0",
            "command": f"clang -target {arch['target']} -{optimization} -fomit-frame-pointer -c example.c",
            "format": arch["format"],
            "captured": True,
        },
        "instructions": instructions,
        "metrics": {"instruction_count": len(instructions), "byte_count": byte_count},
        "result": {"call": call, "value": result, "stdout": f"result = {result}"},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Show a captured CPU compilation example.")
    parser.add_argument("--example", choices=EXAMPLES, default="add")
    parser.add_argument("--architecture", choices=ARCHITECTURES, default="x86_64")
    parser.add_argument("--optimization", choices=("O0", "O2"), default="O2")
    args = parser.parse_args()
    print(json.dumps(build_compilation(args.example, args.architecture, args.optimization), indent=2))


if __name__ == "__main__":
    main()
