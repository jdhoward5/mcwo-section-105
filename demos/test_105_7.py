import importlib
import unittest


x86 = importlib.import_module("105_7")


class CpuCompilationTests(unittest.TestCase):
    def test_optimized_x86_64_add_is_two_instructions(self):
        result = x86.build_compilation("add", "x86_64", "O2", [7, 5])

        self.assertEqual(result["result"]["value"], 12)
        self.assertEqual(result["metrics"], {"instruction_count": 2, "byte_count": 4})
        self.assertEqual(result["instructions"][0]["assembly"], "leal  (%rdi,%rsi), %eax")

    def test_32_bit_arguments_are_read_from_stack(self):
        result = x86.build_compilation("add", "i386", "O2", [-9, 4])

        self.assertEqual(result["result"]["value"], -5)
        self.assertIn("%esp", result["instructions"][0]["assembly"])
        self.assertEqual(result["compiler"]["format"], "Mach-O 32-bit i386")

    def test_optimization_reduces_absolute_instruction_count(self):
        unoptimized = x86.build_compilation("absolute", "x86_64", "O0", [-12])
        optimized = x86.build_compilation("absolute", "x86_64", "O2", [-12])

        self.assertEqual(unoptimized["result"]["value"], 12)
        self.assertLess(optimized["metrics"]["instruction_count"], unoptimized["metrics"]["instruction_count"])
        self.assertTrue(any("cmovs" in row["assembly"] for row in optimized["instructions"]))

    def test_sum3_uses_scaled_memory_offsets(self):
        result = x86.build_compilation("sum3", "x86_64", "O2", [4, 8, 15])

        self.assertEqual(result["result"]["value"], 27)
        self.assertTrue(any("0x8(%rdi)" in row["assembly"] for row in result["instructions"]))

    def test_arm64_uses_fixed_width_instructions(self):
        result = x86.build_compilation("add", "arm64", "O2", [7, 5])

        self.assertEqual(result["result"]["value"], 12)
        self.assertEqual(result["compiler"]["format"], "Mach-O 64-bit arm64")
        self.assertEqual(result["metrics"], {"instruction_count": 2, "byte_count": 8})
        self.assertTrue(all(len(row["bytes"].split()) == 4 for row in result["instructions"]))
        self.assertEqual(result["instructions"][0]["assembly"], "add  w0, w1, w0")

    def test_invalid_options_and_inputs_are_rejected(self):
        with self.assertRaises(ValueError):
            x86.build_compilation("multiply")
        with self.assertRaises(ValueError):
            x86.build_compilation("add", "sparc")
        with self.assertRaises(ValueError):
            x86.build_compilation("add", optimization="O3")
        with self.assertRaises(ValueError):
            x86.build_compilation("add", inputs=[1])
        with self.assertRaises(ValueError):
            x86.build_compilation("absolute", inputs=[True])


if __name__ == "__main__":
    unittest.main()
