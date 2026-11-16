import base64
import importlib
import unittest


build_pipeline = importlib.import_module("105_2").build_pipeline


class PipelineTests(unittest.TestCase):
    def test_unicode_round_trip(self):
        result = build_pipeline("café 📷")

        self.assertEqual(result["decoded"], "café 📷")
        self.assertTrue(result["metrics"]["round_trip_exact"])
        self.assertEqual(result["metrics"]["characters"], 6)
        self.assertEqual(result["metrics"]["utf8_bytes"], 10)

    def test_base64_represents_the_utf8_bytes(self):
        message = "Hello, Bob!"
        result = build_pipeline(message)

        self.assertEqual(
            base64.b64decode(result["base64"]),
            message.encode("utf-8"),
        )
        self.assertIn("Content-Transfer-Encoding: base64", result["mime"])

    def test_empty_message_is_valid(self):
        result = build_pipeline("")

        self.assertEqual(result["utf8"]["decimal"], [])
        self.assertEqual(result["base64"], "")
        self.assertTrue(result["metrics"]["round_trip_exact"])


if __name__ == "__main__":
    unittest.main()
