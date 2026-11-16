import importlib
import unittest


virtualization = importlib.import_module("105_9")


class VirtualizationModelTests(unittest.TestCase):
    def test_type1_hypervisor_sits_directly_on_hardware(self):
        result = virtualization.build_stack("type1")
        ids = [layer["id"] for layer in result["layers"]]

        self.assertEqual(ids[:2], ["hardware", "hypervisor"])
        self.assertFalse(result["stack"]["host_os_present"])
        self.assertEqual(result["comparison"]["kernel_model"], "Separate guest kernel")

    def test_type2_includes_host_and_guest_operating_systems(self):
        result = virtualization.build_stack("type2")
        ids = [layer["id"] for layer in result["layers"]]

        self.assertEqual(ids[:3], ["hardware", "host", "hypervisor"])
        self.assertIn("guest", ids)
        self.assertTrue(result["stack"]["host_os_present"])

    def test_container_shares_host_kernel(self):
        result = virtualization.build_stack("container")
        ids = [layer["id"] for layer in result["layers"]]

        self.assertTrue(result["stack"]["shared_host_kernel"])
        self.assertEqual(result["stack"]["guest_kernels"], 0)
        self.assertNotIn("guest", ids)
        self.assertEqual(result["comparison"]["boot_artifact"], "Container image")

    def test_three_replicas_are_distributed_across_hosts(self):
        result = virtualization.reconcile_cluster(3)

        self.assertTrue(result["converged"])
        self.assertEqual(result["running_replicas"], 3)
        self.assertEqual(sum(bool(host["replicas"]) for host in result["hosts"]), 3)

    def test_host_failure_recovers_when_capacity_exists(self):
        result = virtualization.reconcile_cluster(3, ["host-2"])

        self.assertTrue(result["converged"])
        self.assertEqual(result["healthy_hosts"], 2)
        self.assertEqual(result["running_replicas"], 3)
        self.assertEqual(next(host for host in result["hosts"] if host["id"] == "host-2")["replicas"], [])

    def test_host_failure_can_leave_replicas_pending(self):
        result = virtualization.reconcile_cluster(6, ["host-2"])

        self.assertFalse(result["converged"])
        self.assertEqual(result["running_replicas"], 4)
        self.assertEqual(result["pending_replicas"], 2)
        self.assertTrue(any(event["kind"] == "pending" for event in result["events"]))

    def test_crashed_container_is_replaced(self):
        result = virtualization.reconcile_cluster(3, crashed_replica=2)

        names = [item["name"] for item in result["output"]]
        self.assertIn("web-r2", names)
        self.assertNotIn("web-2", names)
        self.assertTrue(any(event["kind"] == "recovery" for event in result["events"]))

    def test_invalid_inputs_are_rejected(self):
        with self.assertRaises(ValueError):
            virtualization.build_stack("emulator")
        with self.assertRaises(ValueError):
            virtualization.reconcile_cluster(0)
        with self.assertRaises(ValueError):
            virtualization.reconcile_cluster(3, ["host-9"])
        with self.assertRaises(ValueError):
            virtualization.reconcile_cluster(3, ["host-1", "host-1"])
        with self.assertRaises(ValueError):
            virtualization.reconcile_cluster(3, crashed_replica=4)


if __name__ == "__main__":
    unittest.main()
