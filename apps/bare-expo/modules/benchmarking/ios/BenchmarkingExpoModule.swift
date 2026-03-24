import ExpoModulesCore

public final class BenchmarkingExpoModule: Module {
  @OptimizedFunction
  private func addNumbersOptimized(a: Double, b: Double) throws -> Double {
    return a + b
  }

  @OptimizedFunction
  private func addNumbersOptimizedSlowPath(a: Int, b: Int, c: Int) throws -> Int {
    return a + b + c
  }

  public func definition() -> ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function("nothing") {}

    Function("addNumbers") { (a: Double, b: Double) in
      return a + b
    }

    Function("addNumbersOptimized", addNumbersOptimized())
    Function("addNumbersOptimizedSlowPath", addNumbersOptimizedSlowPath())

    Function("addStrings") { (a: String, b: String) in
      return a + b
    }

    Function("foldArray") { (array: [Double]) in
      return array.reduce(0.0, +)
    }
  }
}
