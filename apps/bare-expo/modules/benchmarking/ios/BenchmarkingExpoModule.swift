import ExpoModulesCore

public final class BenchmarkingExpoModule: Module {
  @OptimizedFunction("addNumbers")
  private func addNumbers(a: Double, b: Double) -> Double {
    return a + b
  }

  public func definition() -> ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function("nothing") {}

//    Function("addNumbers") { (a: Double, b: Double) in
//      return a + b
//    }

    // Macro-generated optimized version (Solution 3: attached macro)
    addNumbers()

    Function("addStrings") { (a: String, b: String) in
      return a + b
    }

    Function("foldArray") { (array: [Double]) in
      return array.reduce(0.0, +)
    }
  }
}
