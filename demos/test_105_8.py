import importlib
import unittest


os_model = importlib.import_module("105_8")


class OperatingSystemModelTests(unittest.TestCase):
    def test_file_trace_crosses_boundary_and_reaches_storage(self):
        result = os_model.build_request_trace("file", True)

        self.assertEqual(result["outcome"]["status"], "complete")
        self.assertTrue(any(step["layer"] == "boundary" for step in result["steps"]))
        self.assertTrue(any(step["component"] == "Storage driver" for step in result["steps"]))
        self.assertEqual(result["steps"][-1]["state"], "742 bytes")

    def test_denied_file_request_stops_before_device_io(self):
        result = os_model.build_request_trace("file", False)

        self.assertEqual(result["outcome"]["status"], "denied")
        self.assertFalse(any(step["layer"] == "device" for step in result["steps"]))
        self.assertIn("EACCES", result["trace"][0])

    def test_network_trace_wakes_waiting_process(self):
        result = os_model.build_request_trace("network")

        states = [step["state"] for step in result["steps"]]
        self.assertIn("Waiting", states)
        self.assertIn("Waiting → Ready → Running", states)

    def test_low_pressure_keeps_working_set_resident(self):
        result = os_model.build_memory_model(10, 5)

        self.assertEqual(result["result"]["health"], "Stable working set")
        self.assertFalse(result["result"]["thrashing"])
        self.assertGreaterEqual(result["metrics"]["physical_frames"], 5)

    def test_high_pressure_demonstrates_thrashing(self):
        result = os_model.build_memory_model(90, 7)

        self.assertTrue(result["result"]["thrashing"])
        self.assertEqual(result["result"]["health"], "Thrashing")
        self.assertGreater(result["metrics"]["estimated_faults_per_1000"], 50)
        self.assertTrue(any(mapping["status"] == "swap" for mapping in result["mappings"]))
        self.assertTrue(any(mapping["status"] == "file" for mapping in result["mappings"]))

    def test_unmapped_page_never_receives_backing(self):
        result = os_model.build_memory_model(100, 7)
        page = next(mapping for mapping in result["mappings"] if mapping["page"] == "V0")

        self.assertEqual(page["status"], "unmapped")
        self.assertEqual(page["destination"], "Not mapped")

    def test_invalid_inputs_are_rejected(self):
        with self.assertRaises(ValueError):
            os_model.build_request_trace("printer")
        with self.assertRaises(ValueError):
            os_model.build_request_trace("file", "yes")
        with self.assertRaises(ValueError):
            os_model.build_memory_model(101, 5)
        with self.assertRaises(ValueError):
            os_model.build_memory_model(50, 1)
        with self.assertRaises(ValueError):
            os_model.build_memory_model(True, 5)


if __name__ == "__main__":
    unittest.main()
