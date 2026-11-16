import importlib
import unittest


tradeoffs = importlib.import_module("105_10")


class VirtualizationTradeoffTests(unittest.TestCase):
    def test_consolidation_uses_fewer_physical_hosts(self):
        result = tradeoffs.analyze_virtualization(4, 20, 2)

        self.assertEqual(result["dedicated"]["physical_hosts"], 4)
        self.assertEqual(result["virtualized"]["physical_hosts"], 2)
        self.assertEqual(result["summary"]["hosts_saved"], 2)
        self.assertEqual(result["summary"]["health"], "Consolidated")

    def test_high_demand_causes_resource_contention(self):
        result = tradeoffs.analyze_virtualization(6, 40, 2)

        self.assertGreater(result["virtualized"]["contention_points"], 0)
        self.assertEqual(result["summary"]["health"], "Resource contention")

    def test_dedicated_failure_affects_one_workload(self):
        result = tradeoffs.analyze_virtualization(6, 20, 3, "failure", False)

        self.assertEqual(result["dedicated"]["failure_blast_radius"], 1)
        self.assertEqual(result["dedicated"]["available_workloads"], 5)
        self.assertEqual(result["virtualized"]["failure_blast_radius"], 2)

    def test_recovery_succeeds_when_spare_capacity_exists(self):
        result = tradeoffs.analyze_virtualization(4, 20, 2, "failure", True)

        self.assertEqual(result["virtualized"]["recovered_vms"], 2)
        self.assertEqual(result["virtualized"]["unavailable_vms"], 0)
        self.assertEqual(result["summary"]["health"], "Recovered")

    def test_recovery_fails_without_capacity(self):
        result = tradeoffs.analyze_virtualization(6, 30, 2, "failure", True)

        self.assertEqual(result["virtualized"]["recovered_vms"], 0)
        self.assertEqual(result["virtualized"]["unavailable_vms"], 3)
        self.assertEqual(result["summary"]["health"], "Degraded availability")

    def test_recovery_can_be_disabled(self):
        result = tradeoffs.analyze_virtualization(4, 20, 2, "failure", False)

        self.assertEqual(result["virtualized"]["recovered_vms"], 0)
        self.assertEqual(result["virtualized"]["unavailable_vms"], 2)
        self.assertTrue(any("disabled" in event["message"] for event in result["events"]))

    def test_invalid_inputs_are_rejected(self):
        with self.assertRaises(ValueError):
            tradeoffs.analyze_virtualization(1)
        with self.assertRaises(ValueError):
            tradeoffs.analyze_virtualization(4, 61)
        with self.assertRaises(ValueError):
            tradeoffs.analyze_virtualization(4, 20, 4)
        with self.assertRaises(ValueError):
            tradeoffs.analyze_virtualization(4, 20, 2, "earthquake")
        with self.assertRaises(ValueError):
            tradeoffs.analyze_virtualization(4, 20, 2, recovery_enabled="yes")


if __name__ == "__main__":
    unittest.main()
