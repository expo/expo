package expo.modules.benchmark

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.OptimizedFunction

class BenchmarkingExpoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function<Unit>("nothing") {
      // Do nothing
    }

    // OLD: Slow DSL version (keep for benchmarking comparison)
    Function("addNumbers") { a: Double, b: Double ->
      a + b
    }

    // NEW: Optimized version using annotation-based codegen
    Function("addNumbersOptimized", ::addNumbersOptimized)

    Function("addStrings") { a: String, b: String ->
      a + b
    }

    Function("foldArray") { array: List<Double> ->
      array.sum()
    }
  }

  @OptimizedFunction
  fun addNumbersOptimized(a: Double, b: Double): Double {
    return a + b
  }
}
