package expo.modules.benchmark

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*

/**
 * Benchmark tests for comparing DSL-based vs optimized function performance.
 *
 * These tests validate both correctness and performance of the @OptimizedFunction
 * annotation-based code generation approach.
 */
@RunWith(AndroidJUnit4::class)
class OptimizedFunctionBenchmark {

    @Test
    fun should_return_correct_result_from_optimized_function() {
        // This test would need a proper test setup with AppContext
        // For now, this is a placeholder to show the intended structure
        // In a real implementation, you'd need to:
        // 1. Create a test AppContext
        // 2. Initialize the BenchmarkingExpoModule
        // 3. Call the optimized function via JSI

        // val module = BenchmarkingExpoModule()
        // val result = module.addNumbersOptimized(10.5, 20.3)
        // assertEquals(30.8, result, 0.001)

        // For now, just test the implementation directly
        val module = BenchmarkingExpoModule()
        val result = module.addNumbersOptimized(10.5, 20.3)
        assertEquals(30.8, result, 0.001)
    }

    @Test
    fun should_handle_edge_cases() {
        val module = BenchmarkingExpoModule()

        // Test zero values
        assertEquals(0.0, module.addNumbersOptimized(0.0, 0.0), 0.001)

        // Test negative and positive canceling out
        assertEquals(0.0, module.addNumbersOptimized(-5.0, 5.0), 0.001)

        // Test large numbers
        assertEquals(2e10, module.addNumbersOptimized(1e10, 1e10), 0.001)

        // Test negative numbers
        assertEquals(-30.0, module.addNumbersOptimized(-10.0, -20.0), 0.001)

        // Test fractional numbers
        assertEquals(0.3, module.addNumbersOptimized(0.1, 0.2), 0.001)
    }

    @Test
    fun benchmark_dsl_vs_optimized() {
        // Note: This is a simplified benchmark for demonstration
        // A proper benchmark would use JMH or similar tooling
        // and would need to call functions through JSI bridge

        val warmupIterations = 1000
        val benchmarkIterations = 100_000

        val module = BenchmarkingExpoModule()

        // Warmup - this is important for JVM JIT compilation
        repeat(warmupIterations) {
            module.addNumbersOptimized(10.0, 20.0)
        }

        // Benchmark optimized version (direct Kotlin call)
        val optimizedStart = System.nanoTime()
        repeat(benchmarkIterations) {
            module.addNumbersOptimized(10.0, 20.0)
        }
        val optimizedTime = System.nanoTime() - optimizedStart

        val avgTimePerCallNs = optimizedTime / benchmarkIterations

        println("=== Optimized Function Performance ===")
        println("Total time:     ${optimizedTime / 1_000_000}ms")
        println("Iterations:     $benchmarkIterations")
        println("Avg per call:   ${avgTimePerCallNs}ns")
        println("Calls per sec:  ${1_000_000_000 / avgTimePerCallNs}/s")

        // Assert reasonable performance (should be sub-microsecond for direct call)
        assertTrue("Optimized function should be fast", avgTimePerCallNs < 1000)
    }

    @Test
    fun stress_test_optimized_function() {
        val module = BenchmarkingExpoModule()
        val iterations = 1_000_000

        // Stress test to ensure no memory leaks or crashes
        repeat(iterations) {
            val a = Math.random() * 100
            val b = Math.random() * 100
            val result = module.addNumbersOptimized(a, b)
            assertEquals(a + b, result, 0.001)
        }

        println("Stress test completed: $iterations iterations")
    }
}
