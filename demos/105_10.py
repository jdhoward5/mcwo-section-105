"""Virtualization tradeoff model for the Section 105.10 demo."""

from __future__ import annotations

import argparse
import json
from typing import Any, Dict, List


VM_OVERHEAD_POINTS = 4


def _whole_number(value: Any, name: str, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name} must be a whole number.")
    if value < minimum or value > maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}.")
    return value


def _dedicated_hosts(workloads: int, demand: int, failure: bool) -> List[Dict[str, Any]]:
    hosts = []
    for index in range(1, workloads + 1):
        failed = failure and index == 1
        hosts.append({
            "id": f"server-{index}",
            "status": "failed" if failed else "healthy",
            "used_points": 0 if failed else demand,
            "capacity_points": 100,
            "workloads": [{"id": f"app-{index}", "status": "unavailable" if failed else "running"}],
        })
    return hosts


def analyze_virtualization(
    workloads: int = 4,
    demand_percent: int = 20,
    virtual_hosts: int = 2,
    scenario: str = "steady",
    recovery_enabled: bool = True,
) -> Dict[str, Any]:
    """Compare dedicated hosts with an illustrative Type 1 VM pool."""
    workload_count = _whole_number(workloads, "workloads", 2, 8)
    demand = _whole_number(demand_percent, "demand_percent", 10, 60)
    host_count = _whole_number(virtual_hosts, "virtual_hosts", 2, 3)
    if scenario not in {"steady", "failure"}:
        raise ValueError("scenario must be steady or failure.")
    if not isinstance(recovery_enabled, bool):
        raise ValueError("recovery_enabled must be true or false.")

    failure = scenario == "failure"
    dedicated = _dedicated_hosts(workload_count, demand, failure)
    dedicated_available = workload_count - (1 if failure else 0)

    # Establish the placement before any failure. Each VM consumes useful demand
    # plus a small illustrative overhead allocation for virtualization services.
    base_hosts: List[Dict[str, Any]] = [
        {
            "id": f"vm-host-{index}",
            "status": "failed" if failure and index == 1 else "healthy",
            "capacity_points": 100,
            "vms": [],
        }
        for index in range(1, host_count + 1)
    ]
    for index in range(1, workload_count + 1):
        host = base_hosts[(index - 1) % host_count]
        host["vms"].append({
            "id": f"vm-{index}",
            "workload": f"app-{index}",
            "demand_points": demand,
            "overhead_points": VM_OVERHEAD_POINTS,
            "status": "interrupted" if host["status"] == "failed" else "running",
        })

    for host in base_hosts:
        host["used_points_before_failure"] = sum(vm["demand_points"] + vm["overhead_points"] for vm in host["vms"])
        host["used_points"] = 0 if host["status"] == "failed" else host["used_points_before_failure"]
        host["overloaded"] = host["used_points"] > host["capacity_points"]

    interrupted = [vm for host in base_hosts if host["status"] == "failed" for vm in host["vms"]]
    healthy_hosts = [host for host in base_hosts if host["status"] == "healthy"]
    recovered = []
    unavailable = []
    events = []
    if failure:
        events.append({"kind": "failure", "message": f"vm-host-1 fails and interrupts {len(interrupted)} virtual machine{'s' if len(interrupted) != 1 else ''}."})
        if recovery_enabled:
            events.append({"kind": "recovery", "message": "Recovery automation searches healthy hosts for enough spare capacity to restart affected VM images."})
            for vm in interrupted:
                destination = min(healthy_hosts, key=lambda host: host["used_points"])
                required = vm["demand_points"] + vm["overhead_points"]
                if destination["used_points"] + required <= destination["capacity_points"]:
                    recovered_vm = {**vm, "status": "recovered", "recovered_from": "vm-host-1"}
                    destination["vms"].append(recovered_vm)
                    destination["used_points"] += required
                    recovered.append(recovered_vm)
                    events.append({"kind": "recovery", "message": f"{vm['id']} restarts on {destination['id']} from portable VM storage."})
                else:
                    unavailable.append(vm)
            if unavailable:
                events.append({"kind": "capacity", "message": f"{len(unavailable)} VM{'s remain' if len(unavailable) != 1 else ' remains'} unavailable because healthy capacity is insufficient."})
        else:
            unavailable = interrupted[:]
            events.append({"kind": "capacity", "message": "Recovery is disabled, so interrupted VMs remain unavailable until the host returns."})

    for host in healthy_hosts:
        host["overloaded"] = host["used_points"] > host["capacity_points"]

    virtual_available = workload_count - len(unavailable)
    total_overhead = workload_count * VM_OVERHEAD_POINTS
    steady_allocated = workload_count * (demand + VM_OVERHEAD_POINTS)
    contention_points = sum(max(0, host["used_points"] - host["capacity_points"]) for host in healthy_hosts)
    baseline_contention = max(0, steady_allocated - host_count * 100)
    contention_points = max(contention_points, baseline_contention if not failure else 0)
    failed_blast_radius = len(interrupted)

    if unavailable:
        health = "Degraded availability"
        health_detail = f"{len(unavailable)} workload{'s are' if len(unavailable) != 1 else ' is'} unavailable after the host failure."
    elif contention_points:
        health = "Resource contention"
        health_detail = "Allocated demand exceeds host capacity, so workloads must wait or receive less CPU time."
    elif failure and recovered:
        health = "Recovered"
        health_detail = "Portable VM images restarted on healthy hosts with sufficient spare capacity."
    else:
        health = "Consolidated"
        health_detail = "The current workload fits without exceeding the illustrative host capacity."

    benefits = [
        {"id": "utilization", "title": "Hardware utilization", "evidence": f"{workload_count} workloads use {host_count} virtual hosts instead of {workload_count} dedicated servers."},
        {"id": "isolation", "title": "Isolation", "evidence": "Each application runs behind a separate guest OS boundary, limiting many application-level failures."},
        {"id": "portability", "title": "Portability", "evidence": "VM configuration and virtual disks can be registered on compatible hosts."},
        {"id": "testing", "title": "Testing", "evidence": "VM images can be cloned or snapshotted to create repeatable test environments."},
        {"id": "recovery", "title": "Disaster recovery", "evidence": f"{len(recovered)} interrupted VM{'s' if len(recovered) != 1 else ''} restarted on healthy capacity in this drill." if failure else "Portable VM images can support backup, replication, and recovery workflows."},
        {"id": "provisioning", "title": "Rapid provisioning", "evidence": "Software-defined hardware can be created from an image without installing a new physical server."},
    ]
    disadvantages = [
        {"id": "overhead", "title": "Performance overhead", "evidence": f"The model reserves {total_overhead} CPU points for hypervisor and VM-management work."},
        {"id": "complexity", "title": "Management complexity", "evidence": "Operators must manage physical hosts, hypervisors, virtual networks, storage, images, and guest operating systems."},
        {"id": "cost", "title": "Cost", "evidence": "Hypervisor licensing, shared storage, backup, management, and resilient infrastructure can add expense."},
        {"id": "contention", "title": "Resource contention", "evidence": f"Current allocation exceeds capacity by {contention_points} CPU points." if contention_points else "Current allocation fits, but colocated VMs still compete when demand rises."},
        {"id": "blast-radius", "title": "Shared-host failure", "evidence": f"One virtual host failure interrupts {failed_blast_radius} VM{'s' if failed_blast_radius != 1 else ''}." if failure else "A host or hypervisor failure can interrupt every VM placed on that system."},
    ]

    return {
        "inputs": {
            "workloads": workload_count,
            "demand_percent": demand,
            "virtual_hosts": host_count,
            "scenario": scenario,
            "recovery_enabled": recovery_enabled,
        },
        "dedicated": {
            "hosts": dedicated,
            "physical_hosts": workload_count,
            "available_workloads": dedicated_available,
            "average_useful_utilization": demand,
            "failure_blast_radius": 1 if failure else 0,
        },
        "virtualized": {
            "hosts": base_hosts,
            "physical_hosts": host_count,
            "available_workloads": virtual_available,
            "average_allocated_percent": round(steady_allocated / host_count, 1),
            "overhead_points": total_overhead,
            "contention_points": contention_points,
            "failure_blast_radius": failed_blast_radius,
            "recovered_vms": len(recovered),
            "unavailable_vms": len(unavailable),
        },
        "summary": {
            "health": health,
            "detail": health_detail,
            "hosts_saved": max(0, workload_count - host_count),
            "all_workloads_available": virtual_available == workload_count,
        },
        "events": events,
        "benefits": benefits,
        "disadvantages": disadvantages,
        "scope": "CPU points are an illustrative allocation model, not benchmark results or universal virtualization overhead measurements.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Explore virtualization advantages and disadvantages.")
    parser.add_argument("--workloads", type=int, default=4)
    parser.add_argument("--demand", type=int, default=20)
    parser.add_argument("--hosts", type=int, default=2)
    parser.add_argument("--failure", action="store_true")
    parser.add_argument("--no-recovery", action="store_true")
    args = parser.parse_args()
    print(json.dumps(analyze_virtualization(
        args.workloads,
        args.demand,
        args.hosts,
        "failure" if args.failure else "steady",
        not args.no_recovery,
    ), indent=2))


if __name__ == "__main__":
    main()
