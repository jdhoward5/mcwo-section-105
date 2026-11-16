"""Operating-system request and virtual-memory models for Section 105.8."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, List


SCENARIOS = {
    "file": {
        "title": "Read a file",
        "command": "cat report.txt",
        "question": "How does a shell command become bytes on the display?",
        "syscalls": [
            'openat(AT_FDCWD, "report.txt", O_RDONLY) = 3',
            "read(3, buffer, 4096) = 742",
            "write(1, buffer, 742) = 742",
            "close(3) = 0",
        ],
    },
    "launch": {
        "title": "Launch a program",
        "command": "./analyze",
        "question": "How does an executable become a running process?",
        "syscalls": [
            'execve("./analyze", ["./analyze"], envp) = 0',
            'mmap(NULL, 16384, PROT_READ|PROT_EXEC, MAP_PRIVATE, 3, 0) = 0x1000',
            "brk(0x6000) = 0x6000",
        ],
    },
    "signal": {
        "title": "Press Ctrl+C",
        "command": "Ctrl+C",
        "question": "How does an asynchronous event reach a running process?",
        "syscalls": [
            "read(0, buffer, 1024) = ? ERESTARTSYS",
            "--- SIGINT {si_signo=SIGINT, si_code=SI_KERNEL} ---",
            "exit_group(130) = ?",
        ],
    },
    "network": {
        "title": "Receive a packet",
        "command": "recv(socket, buffer)",
        "question": "How does network data wake a waiting process?",
        "syscalls": [
            "socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 4",
            "recvfrom(4, buffer, 4096, 0, NULL, NULL) = 512",
        ],
    },
}


def _step(layer: str, component: str, action: str, state: str) -> Dict[str, str]:
    return {"layer": layer, "component": component, "action": action, "state": state}


def build_request_trace(scenario: str = "file", access_granted: bool = True) -> Dict[str, Any]:
    """Build a deterministic trace through user space, the kernel, and hardware."""
    if scenario not in SCENARIOS:
        raise ValueError("scenario must be file, launch, signal, or network.")
    if not isinstance(access_granted, bool):
        raise ValueError("access_granted must be true or false.")

    if scenario == "file":
        steps = [
            _step("user", "Command interpreter", "The shell parses `cat report.txt` and launches the file utility.", "User request"),
            _step("boundary", "System-call interface", "The utility requests `openat()`; execution crosses into privileged kernel code.", "Trap to kernel"),
            _step("kernel", "Access control", "The kernel checks the process identity and the file's permissions.", "Allowed" if access_granted else "Denied"),
        ]
        if access_granted:
            steps.extend([
                _step("kernel", "Filesystem", "The filesystem resolves the path and locates file metadata and data blocks.", "Descriptor 3"),
                _step("device", "Storage driver", "The driver requests missing blocks; the process waits while the device completes I/O.", "Waiting"),
                _step("kernel", "Process scheduler", "Completion makes the process ready, and the scheduler gives it CPU time again.", "Ready → Running"),
                _step("user", "File utility", "`read()` returns bytes and `write()` sends them to standard output.", "742 bytes"),
            ])
            outcome = {"status": "complete", "label": "File displayed", "detail": "The request crossed the kernel boundary and returned 742 bytes."}
            trace = SCENARIOS[scenario]["syscalls"]
        else:
            steps.extend([
                _step("boundary", "System-call return", "The kernel returns an error without asking the filesystem driver to read data.", "EACCES"),
                _step("user", "File utility", "The utility reports that permission was denied.", "Exit status 1"),
            ])
            outcome = {"status": "denied", "label": "Access denied", "detail": "Protection stopped the request before device I/O."}
            trace = [
                'openat(AT_FDCWD, "report.txt", O_RDONLY) = -1 EACCES',
                'write(2, "cat: report.txt: Permission denied\\n", 35) = 35',
                "exit_group(1) = ?",
            ]
    elif scenario == "launch":
        steps = [
            _step("user", "Command interpreter", "The shell parses `./analyze` and requests creation of a new program image.", "Launch request"),
            _step("boundary", "System-call interface", "An execution system call transfers control to the kernel.", "Trap to kernel"),
            _step("kernel", "Access control", "The kernel verifies execute permission and the executable format.", "Allowed"),
            _step("kernel", "Virtual-memory manager", "Executable sections are mapped; stack and heap regions are established in a new address space.", "Address space ready"),
            _step("kernel", "Process manager", "The OS creates process records, resources, and an initial thread.", "New → Ready"),
            _step("kernel", "Scheduler", "The ready thread is selected and its execution context is loaded onto a CPU.", "Ready → Running"),
            _step("user", "Application", "The processor begins executing the program's user-space entry point.", "Running"),
        ]
        outcome = {"status": "complete", "label": "Process running", "detail": "The executable now has an isolated address space and scheduled thread."}
        trace = SCENARIOS[scenario]["syscalls"]
    elif scenario == "signal":
        steps = [
            _step("device", "Terminal device", "The terminal recognizes Ctrl+C as an interrupt character.", "Input event"),
            _step("kernel", "Device driver", "The terminal driver reports the event to the kernel.", "Interrupt handled"),
            _step("kernel", "Signal manager", "The foreground process is marked with a pending SIGINT notification.", "SIGINT pending"),
            _step("kernel", "Scheduler", "Before returning to user space, the kernel prepares signal delivery.", "Process selected"),
            _step("user", "Process", "A registered handler runs, or the default SIGINT action terminates the process.", "Terminated"),
            _step("user", "Command interpreter", "The shell regains control and presents another prompt.", "Ready"),
        ]
        outcome = {"status": "complete", "label": "Signal delivered", "detail": "The asynchronous notification interrupted normal process flow."}
        trace = SCENARIOS[scenario]["syscalls"]
    else:
        steps = [
            _step("user", "Application", "The process calls `recv()` but no data is available yet.", "Running"),
            _step("boundary", "System-call interface", "The receive request enters the kernel and the process is placed on a wait queue.", "Waiting"),
            _step("device", "Network interface", "A frame arrives and the device raises an interrupt.", "512 bytes received"),
            _step("kernel", "Network driver", "The driver transfers the frame into a kernel buffer.", "Interrupt handled"),
            _step("kernel", "Protocol stack", "Ethernet, IP, and TCP processing associates payload bytes with the socket.", "Socket readable"),
            _step("kernel", "Scheduler", "The waiting process becomes ready and is later selected to run.", "Waiting → Ready → Running"),
            _step("user", "Application", "`recv()` returns the payload to the application's buffer.", "512 bytes"),
        ]
        outcome = {"status": "complete", "label": "Packet delivered", "detail": "An interrupt and the protocol stack woke the waiting process."}
        trace = SCENARIOS[scenario]["syscalls"]

    return {
        "scenario": {**SCENARIOS[scenario], "id": scenario},
        "access_granted": access_granted,
        "steps": [{**step, "number": index + 1} for index, step in enumerate(steps)],
        "outcome": outcome,
        "trace": trace,
        "trace_note": "Representative Linux-style system-call trace; names and details vary by operating system.",
    }


VIRTUAL_PAGES = [
    {"page": "V7", "address": "0x7000", "region": "Stack", "backing": "anonymous", "active": True},
    {"page": "V6", "address": "0x6000", "region": "Stack", "backing": "anonymous", "active": False},
    {"page": "V5", "address": "0x5000", "region": "Mapped file", "backing": "file", "active": True},
    {"page": "V4", "address": "0x4000", "region": "Mapped file", "backing": "file", "active": False},
    {"page": "V3", "address": "0x3000", "region": "Heap", "backing": "anonymous", "active": True},
    {"page": "V2", "address": "0x2000", "region": "Heap", "backing": "anonymous", "active": True},
    {"page": "V1", "address": "0x1000", "region": "Program code", "backing": "file", "active": True},
    {"page": "V0", "address": "0x0000", "region": "Unmapped", "backing": "none", "active": False},
]


def _whole_number(value: Any, name: str, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name} must be a whole number.")
    if value < minimum or value > maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}.")
    return value


def build_memory_model(memory_pressure: int = 35, working_set_pages: int = 5) -> Dict[str, Any]:
    """Map illustrative virtual pages to frames, files, swap, or no backing."""
    pressure = _whole_number(memory_pressure, "memory_pressure", 0, 100)
    working_set = _whole_number(working_set_pages, "working_set_pages", 2, 7)
    frame_count = max(2, 7 - pressure // 18)
    frame_ids = [0, 2, 5, 1, 6, 3, 4][:frame_count]
    candidates = [page for page in VIRTUAL_PAGES if page["backing"] != "none"]
    active_ids = {page["page"] for page in candidates[:working_set]}
    resident_ids = {page["page"] for page in candidates[:frame_count]}

    mappings: List[Dict[str, Any]] = []
    next_frame = 0
    swap_slot = 0
    for page in VIRTUAL_PAGES:
        is_active = page["page"] in active_ids
        if page["backing"] == "none":
            destination = "Not mapped"
            status = "unmapped"
        elif page["page"] in resident_ids:
            destination = f"Frame F{frame_ids[next_frame]}"
            next_frame += 1
            status = "resident"
        elif page["backing"] == "file":
            destination = "Mapped file"
            status = "file"
        else:
            destination = f"Swap slot S{swap_slot}"
            swap_slot += 1
            status = "swap"
        mappings.append({**page, "active": is_active, "destination": destination, "status": status})

    shortage = max(0, working_set - frame_count)
    faults = shortage * 18 + (4 if pressure >= 55 else 1)
    thrashing = shortage >= 2 and pressure >= 70
    if thrashing:
        health = "Thrashing"
        explanation = "The active working set exceeds available frames, so repeated page faults dominate useful work."
    elif shortage:
        health = "Page pressure"
        explanation = "Some active pages are not resident. Page faults load them from a file or swap and may evict other pages."
    else:
        health = "Stable working set"
        explanation = "The active pages fit in available frames, so most memory references avoid page faults."

    return {
        "inputs": {"memory_pressure": pressure, "working_set_pages": working_set},
        "metrics": {
            "physical_frames": frame_count,
            "available_frame_ids": frame_ids,
            "resident_pages": len(resident_ids),
            "working_set_pages": working_set,
            "estimated_faults_per_1000": faults,
            "swap_pages": sum(mapping["status"] == "swap" for mapping in mappings),
        },
        "mappings": mappings,
        "result": {"health": health, "thrashing": thrashing, "explanation": explanation},
        "notes": {
            "paging": "Paging moves fixed-size pages between virtual mappings, physical frames, files, and swap backing.",
            "swapping": "Historically, swapping moved an entire process; modern 'swap' commonly refers to backing selected pages on storage.",
            "scope": "This is an illustrative address space, not a literal layout for every operating system or process.",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Explore operating-system request and memory models.")
    parser.add_argument("--scenario", choices=SCENARIOS, default="file")
    parser.add_argument("--deny", action="store_true")
    parser.add_argument("--pressure", type=int, default=35)
    parser.add_argument("--working-set", type=int, default=5)
    args = parser.parse_args()
    print(json.dumps({
        "trace": build_request_trace(args.scenario, not args.deny),
        "memory": build_memory_model(args.pressure, args.working_set),
    }, indent=2))


if __name__ == "__main__":
    main()
