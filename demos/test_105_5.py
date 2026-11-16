import importlib
import unittest


ntp = importlib.import_module("105_5")


class NtpSimulationTests(unittest.TestCase):
    def test_symmetric_path_estimates_exact_correction(self):
        result = ntp.simulate_exchange(240, 36, 4, 36)

        self.assertEqual(result["calculation"]["round_trip_delay_ms"], 72)
        self.assertEqual(result["calculation"]["estimated_correction_ms"], -240)
        self.assertEqual(result["result"]["after_error_ms"], 0)
        self.assertTrue(result["result"]["estimate_exact"])

    def test_asymmetric_path_biases_the_estimate(self):
        result = ntp.simulate_exchange(240, 20, 4, 100)

        self.assertEqual(result["calculation"]["round_trip_delay_ms"], 120)
        self.assertEqual(result["calculation"]["estimated_correction_ms"], -280)
        self.assertEqual(result["result"]["after_error_ms"], -40)
        self.assertFalse(result["result"]["estimate_exact"])

    def test_server_processing_is_removed_from_network_delay(self):
        quick = ntp.simulate_exchange(0, 15, 2, 25)
        slow = ntp.simulate_exchange(0, 15, 80, 25)

        self.assertEqual(quick["calculation"]["round_trip_delay_ms"], 40)
        self.assertEqual(slow["calculation"]["round_trip_delay_ms"], 40)
        self.assertEqual(
            quick["calculation"]["estimated_correction_ms"],
            slow["calculation"]["estimated_correction_ms"],
        )

    def test_slow_client_receives_positive_correction(self):
        result = ntp.simulate_exchange(-125, 30, 5, 30)

        self.assertEqual(result["calculation"]["estimated_correction_ms"], 125)
        self.assertEqual(result["result"]["after_error_ms"], 0)

    def test_invalid_input_is_rejected(self):
        with self.assertRaises(ValueError):
            ntp.simulate_exchange("fast", 10, 2, 10)
        with self.assertRaises(ValueError):
            ntp.simulate_exchange(0, 501, 2, 10)


if __name__ == "__main__":
    unittest.main()
