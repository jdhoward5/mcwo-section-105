"""Virtualization stack and container-orchestrator models for Section 105.9."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, List, Optional


STACKS = {
    "type1": {
        "label": "Type 1 hypervisor",
        "short": "Bare-metal virtualization",
        "summary": "The hypervisor runs directly on the physical system and manages virtual machines without a general-purpose host OS underneath.",
        "isolation_unit": "Virtual machine",
        "guest_kernels": 1,
        "shared_host_kernel": False,
        "host_os_present": False,
        "layers": [
            {"id": "hardware", "label": "Physical hardware", "owner": "Infrastructure operator", "privilege": "Physical", "detail": "Processors, memory, storage, and network devices supply the real resources."},
            {"id": "hypervisor", "label": "Type 1 hypervisor", "owner": "Virtualization platform", "privilege": "Most privileged software", "detail": "The bare-metal hypervisor schedules virtual CPUs and maps virtual devices to physical resources."},
            {"id": "vm", "label": "Virtual machine", "owner": "VM administrator", "privilege": "Isolation boundary", "detail": "A software-defined computer exposes virtual processors, memory, disks, and network interfaces."},
            {"id": "guest", "label": "Guest OS + kernel", "owner": "VM administrator", "privilege": "Guest privileged mode", "detail": "The guest operating system manages processes and devices inside this VM."},
            {"id": "application", "label": "Application", "owner": "Application team", "privilege": "Guest user space", "detail": "The application uses the guest kernel and does not directly control physical hardware."},
        ],
    },
    "type2": {
        "label": "Type 2 hypervisor",
        "short": "Hosted virtualization",
        "summary": "The hypervisor runs as an application on a conventional host operating system, which remains between it and physical hardware.",
        "isolation_unit": "Virtual machine",
        "guest_kernels": 1,
        "shared_host_kernel": False,
        "host_os_present": True,
        "layers": [
            {"id": "hardware", "label": "Physical hardware", "owner": "Device owner", "privilege": "Physical", "detail": "The desktop or workstation provides physical processors, memory, storage, and networking."},
            {"id": "host", "label": "Host OS + kernel", "owner": "Device administrator", "privilege": "Host privileged mode", "detail": "The host OS manages physical devices and runs the hypervisor application."},
            {"id": "hypervisor", "label": "Type 2 hypervisor", "owner": "Device user", "privilege": "Hosted application", "detail": "The hosted hypervisor provides virtual hardware while relying on host OS services."},
            {"id": "vm", "label": "Virtual machine", "owner": "VM administrator", "privilege": "Isolation boundary", "detail": "The VM behaves like a distinct computer with its own assigned virtual resources."},
            {"id": "guest", "label": "Guest OS + kernel", "owner": "VM administrator", "privilege": "Guest privileged mode", "detail": "A complete guest operating system controls processes inside the VM."},
            {"id": "application", "label": "Application", "owner": "Application team", "privilege": "Guest user space", "detail": "The application makes system calls to its guest kernel."},
        ],
    },
    "container": {
        "label": "Containerization",
        "short": "Shared-kernel isolation",
        "summary": "Containers package applications and dependencies into isolated environments while sharing the host operating-system kernel.",
        "isolation_unit": "Container",
        "guest_kernels": 0,
        "shared_host_kernel": True,
        "host_os_present": True,
        "layers": [
            {"id": "hardware", "label": "Physical hardware", "owner": "Infrastructure operator", "privilege": "Physical", "detail": "The host supplies real processor, memory, storage, and network resources."},
            {"id": "host", "label": "Host OS + kernel", "owner": "Host administrator", "privilege": "Host privileged mode", "detail": "One kernel manages hardware and provides process, network, and filesystem isolation primitives."},
            {"id": "runtime", "label": "Container runtime", "owner": "Platform team", "privilege": "Host service", "detail": "The runtime creates container processes, filesystems, resource limits, and virtual networks."},
            {"id": "container", "label": "Container boundary", "owner": "Application team", "privilege": "Process isolation", "detail": "The container packages an application and dependencies but does not contain a separate guest kernel."},
            {"id": "application", "label": "Application", "owner": "Application team", "privilege": "Container user space", "detail": "The application remains a host-kernel process with an isolated view of selected resources."},
        ],
    },
}


VM_RESOURCES = [
    {"id": "cpu", "virtual": "2 vCPUs", "physical": "Scheduled on host CPU cores", "kind": "virtual hardware"},
    {"id": "memory", "virtual": "4 GiB virtual RAM", "physical": "Mapped to host memory", "kind": "virtual hardware"},
    {"id": "disk", "virtual": "40 GiB virtual disk", "physical": "Backed by a host file or volume", "kind": "virtual device"},
    {"id": "network", "virtual": "Virtual network adapter", "physical": "Connected through a virtual switch", "kind": "virtual device"},
]

CONTAINER_RESOURCES = [
    {"id": "cpu", "virtual": "1 CPU limit", "physical": "Host scheduler enforces a share or quota", "kind": "resource control"},
    {"id": "memory", "virtual": "256 MiB limit", "physical": "Host kernel accounts physical memory", "kind": "resource control"},
    {"id": "disk", "virtual": "Writable container layer", "physical": "Backed by host storage", "kind": "filesystem view"},
    {"id": "network", "virtual": "Container network interface", "physical": "Host networking connects its namespace", "kind": "isolated view"},
]


def build_stack(stack_type: str = "type1") -> Dict[str, Any]:
    """Return an inspectable virtualization or containerization layer stack."""
    if stack_type not in STACKS:
        raise ValueError("stack_type must be type1, type2, or container.")
    stack = STACKS[stack_type]
    return {
        "stack": {key: value for key, value in stack.items() if key != "layers"} | {"id": stack_type},
        "layers": [{**layer, "position": index + 1} for index, layer in enumerate(stack["layers"])],
        "resources": CONTAINER_RESOURCES if stack_type == "container" else VM_RESOURCES,
        "comparison": {
            "kernel_model": "Shared host kernel" if stack["shared_host_kernel"] else "Separate guest kernel",
            "host_layer": "Present" if stack["host_os_present"] else "Not beneath hypervisor",
            "isolation_boundary": stack["isolation_unit"],
            "boot_artifact": "Container image" if stack_type == "container" else "VM image + guest OS",
        },
    }


HOST_IDS = ("host-1", "host-2", "host-3")
HOST_CAPACITY = 2


def _whole_number(value: Any, name: str, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name} must be a whole number.")
    if value < minimum or value > maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}.")
    return value


def reconcile_cluster(
    desired_replicas: int = 3,
    failed_hosts: Optional[List[str]] = None,
    crashed_replica: Optional[int] = None,
) -> Dict[str, Any]:
    """Reconcile a desired container replica count against three small hosts."""
    desired = _whole_number(desired_replicas, "desired_replicas", 1, 6)
    failed = [] if failed_hosts is None else failed_hosts
    if not isinstance(failed, list) or any(host not in HOST_IDS for host in failed):
        raise ValueError("failed_hosts must be a list containing host-1, host-2, or host-3.")
    if len(set(failed)) != len(failed):
        raise ValueError("failed_hosts must not contain duplicates.")
    if crashed_replica is not None:
        crashed_replica = _whole_number(crashed_replica, "crashed_replica", 1, desired)

    healthy_hosts = [host for host in HOST_IDS if host not in failed]
    capacity = len(healthy_hosts) * HOST_CAPACITY
    running_target = min(desired, capacity)
    hosts = {
        host: {"id": host, "status": "unavailable" if host in failed else "healthy", "capacity": HOST_CAPACITY, "replicas": []}
        for host in HOST_IDS
    }
    events = [{"kind": "desired", "message": f"Desired state declares {desired} web replica{'s' if desired != 1 else ''}."}]
    if failed:
        for host in failed:
            events.append({"kind": "failure", "message": f"Health monitoring marks {host} unavailable; its workloads need new placement."})
    if crashed_replica is not None:
        events.append({"kind": "failure", "message": f"web-{crashed_replica} exited unexpectedly and no longer satisfies desired state."})

    host_slots = {host: 0 for host in healthy_hosts}
    placements = []
    host_cursor = 0
    for index in range(1, running_target + 1):
        attempts = 0
        while healthy_hosts and host_slots[healthy_hosts[host_cursor % len(healthy_hosts)]] >= HOST_CAPACITY:
            host_cursor += 1
            attempts += 1
            if attempts > len(healthy_hosts):
                break
        host = healthy_hosts[host_cursor % len(healthy_hosts)]
        replacement = crashed_replica == index
        replica_id = f"web-r{index}" if replacement else f"web-{index}"
        replica = {"id": replica_id, "status": "running", "replacement": replacement, "cpu": 1, "memory_mib": 256}
        hosts[host]["replicas"].append(replica)
        placements.append({"replica": replica_id, "host": host, "status": "Running"})
        host_slots[host] += 1
        host_cursor += 1

    pending = desired - running_target
    if crashed_replica is not None and crashed_replica <= running_target:
        replacement_host = next(item["host"] for item in placements if item["replica"] == f"web-r{crashed_replica}")
        events.append({"kind": "recovery", "message": f"The controller creates web-r{crashed_replica}; the scheduler places it on {replacement_host}."})
    if failed and pending == 0:
        events.append({"kind": "recovery", "message": "Healthy hosts have enough capacity, so the scheduler restores the requested replica count."})
    if pending:
        events.append({"kind": "pending", "message": f"{pending} replica{'s are' if pending != 1 else ' is'} Pending because healthy hosts have no free slots."})
    else:
        events.append({"kind": "healthy", "message": "Actual state now matches desired state."})

    host_list = []
    for host in HOST_IDS:
        item = hosts[host]
        item["used_slots"] = len(item["replicas"])
        item["free_slots"] = 0 if item["status"] == "unavailable" else HOST_CAPACITY - item["used_slots"]
        host_list.append(item)

    output = [
        {"name": item["replica"], "host": item["host"], "status": item["status"]}
        for item in placements
    ]
    output.extend({"name": f"web-p{index}", "host": "—", "status": "Pending"} for index in range(1, pending + 1))

    return {
        "desired_replicas": desired,
        "running_replicas": running_target,
        "pending_replicas": pending,
        "healthy_hosts": len(healthy_hosts),
        "available_capacity": capacity,
        "converged": pending == 0,
        "hosts": host_list,
        "events": events,
        "output": output,
        "configuration": {"application": "web", "replicas": desired, "cpu": 1, "memory": "256 MiB"},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Explore virtualization and orchestration models.")
    parser.add_argument("--stack", choices=STACKS, default="type1")
    parser.add_argument("--replicas", type=int, default=3)
    parser.add_argument("--fail-host", choices=HOST_IDS)
    parser.add_argument("--crash-replica", type=int)
    args = parser.parse_args()
    print(json.dumps({
        "stack": build_stack(args.stack),
        "cluster": reconcile_cluster(args.replicas, [args.fail_host] if args.fail_host else [], args.crash_replica),
    }, indent=2))


if __name__ == "__main__":
    main()
