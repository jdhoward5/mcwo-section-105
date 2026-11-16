import importlib
import unittest


serialization = importlib.import_module("105_4")


class SerializationTests(unittest.TestCase):
    def test_round_trip_preserves_values_and_types(self):
        record = {
            "name": "Avery",
            "clearance": 3,
            "active": True,
            "roles": ["analyst", "operator"],
            "note": None,
        }
        result = serialization.build_round_trip(record)

        self.assertEqual(result["restored"], record)
        self.assertTrue(result["metrics"]["exact"])
        self.assertEqual(
            result["types"],
            {
                "name": "string",
                "clearance": "number",
                "active": "boolean",
                "roles": "array",
                "note": "null",
            },
        )

    def test_utf8_representation_handles_non_ascii_text(self):
        result = serialization.build_round_trip({"label": "café 📷"})

        self.assertGreater(
            result["utf8"]["byte_count"],
            result["metrics"]["json_characters"],
        )
        self.assertEqual(
            bytes(result["utf8"]["decimal"]).decode("utf-8"),
            result["serialized"],
        )

    def test_serialized_form_is_compact_json_text(self):
        result = serialization.build_round_trip({"ready": True, "items": [1, 2]})

        self.assertEqual(result["serialized"], '{"ready":true,"items":[1,2]}')

    def test_non_object_and_empty_records_are_rejected(self):
        with self.assertRaises(ValueError):
            serialization.build_round_trip([])
        with self.assertRaises(ValueError):
            serialization.build_round_trip({})


if __name__ == "__main__":
    unittest.main()
