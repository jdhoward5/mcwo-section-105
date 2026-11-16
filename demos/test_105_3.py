import importlib
import unittest


compression = importlib.import_module("105_3")


class CompressionTests(unittest.TestCase):
    def test_rle_round_trip_is_exact(self):
        original = [7, 7, 7, 9, 9, 12]
        runs = compression.run_length_encode(original)

        self.assertEqual(runs, [(3, 7), (2, 9), (1, 12)])
        self.assertEqual(compression.run_length_decode(runs), original)

    def test_comparison_uses_same_source_for_both_paths(self):
        result = compression.build_comparison(compression.DEFAULT_BYTES, 16)

        self.assertEqual(result["lossless"]["decoded"], result["original"])
        self.assertTrue(result["lossless"]["metrics"]["exact"])
        self.assertEqual(result["lossless"]["metrics"]["encoded_bytes"], 16)
        self.assertEqual(result["lossy"]["decoded"], [32] * 7 + [80] * 6 + [128] * 5)
        self.assertFalse(result["lossy"]["metrics"]["exact"])
        self.assertEqual(result["lossy"]["metrics"]["encoded_bytes"], 6)

    def test_lossy_path_reports_every_changed_byte(self):
        result = compression.build_comparison([15, 16, 17, 31, 32], 16)

        self.assertEqual(result["lossy"]["decoded"], [0, 16, 16, 16, 32])
        self.assertEqual(result["lossy"]["metrics"]["changed_indices"], [0, 2, 3])

    def test_invalid_bytes_and_steps_are_rejected(self):
        with self.assertRaises(ValueError):
            compression.build_comparison([], 16)
        with self.assertRaises(ValueError):
            compression.build_comparison([256], 16)
        with self.assertRaises(ValueError):
            compression.build_comparison([1, 2], 3)


if __name__ == "__main__":
    unittest.main()
