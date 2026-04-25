import ExpoModulesCore

struct Point: Record {
  @Field
  var x: Double = 0

  @Field
  var y: Double = 0
}

public final class BenchmarkingExpoModule: Module {
//  @OptimizedFunction
  private func addNumbersOptimized(a: Double, b: Double) throws -> Double {
    return a + b
  }

//  @OptimizedFunction
  private func addNumbersAsyncOptimized(a: Double, b: Double) throws -> Double {
    return a + b
  }

  public func definition() -> ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function("nothing") {}

    Function("addNumbers") { (a: Double, b: Double) in
      return a + b
    }

    Function("addNumbersOptimized", addNumbersOptimized)

    Function("addStrings") { (a: String, b: String) in
      return a + b
    }

    Function("foldArray") { (array: [Double]) in
      return array.reduce(0.0, +)
    }

    Function("echoObject") { (point: Point) in
      return point
    }

    AsyncFunction("addNumbersAsync") { (a: Double, b: Double) in
      return a + b
    }

    AsyncFunction("addNumbersAsyncOptimized", addNumbersAsyncOptimized)
  }
}
