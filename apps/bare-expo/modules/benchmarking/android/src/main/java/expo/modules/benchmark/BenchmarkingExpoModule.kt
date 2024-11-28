package expo.modules.benchmark

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BenchmarkingExpoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function<Unit>("nothing") {
      // Do nothing
    }

    Function("addNumbers") { a: Double, b: Double ->
      a + b
    }

    Function("addStrings") { a: String, b: String ->
      a + b
    }

    Function("foldArray") { array: List<Double> ->
      array.sum()
    }
  }
}
