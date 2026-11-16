"""Coverage for the local notes API's source boundaries and content mapping."""
from pathlib import Path
import tempfile
import unittest

from notes import read_topic


class NotesTests(unittest.TestCase):
    def test_every_curriculum_topic_has_nonempty_notes(self):
        for number in range(1, 29):
            with self.subTest(number=number):
                notes = read_topic(f"105-{number}")
                self.assertEqual(notes["number"], f"105.{number}")
                self.assertTrue(notes["markdown"].strip())

    def test_foundations_use_the_definition_source_and_keep_citations(self):
        notes = read_topic("105-1")
        self.assertEqual(notes["source"], "105.1.md")
        self.assertIn("### Protocol", notes["markdown"])
        self.assertIn("https://", notes["markdown"])
        self.assertNotIn("[[105.1#", notes["markdown"])

    def test_section_stops_before_next_topic(self):
        notes = read_topic("105-8")
        self.assertIn("### Command interpreter", notes["markdown"])
        self.assertNotIn("### Hypervisor", notes["markdown"])

    def test_unknown_and_path_like_topics_are_rejected(self):
        for topic in ["105-0", "105-29", "105-01", "105.2", "../105.1.md", "105-2/../../x", "105-2?x=1"]:
            with self.subTest(topic=topic), self.assertRaises(KeyError):
                read_topic(topic)

    def test_reads_current_source_without_a_build_or_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            overview = root / "Information Fundamentals Overview.md"
            overview.write_text("## 105.2 Example\n\nOriginal text.\n", encoding="utf-8")
            self.assertEqual(read_topic("105-2", root)["markdown"], "Original text.")
            overview.write_text("## 105.2 Example\n\nUpdated text.\n", encoding="utf-8")
            self.assertEqual(read_topic("105-2", root)["markdown"], "Updated text.")


if __name__ == "__main__":
    unittest.main()
