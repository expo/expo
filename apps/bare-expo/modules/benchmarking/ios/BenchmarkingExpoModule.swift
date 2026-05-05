import ExpoModulesCore

struct Point: Record {
  @Field
  var x: Double = 0

  @Field
  var y: Double = 0
}

final class SharedPoint: SharedObject {
  var x: Double = 0
  var y: Double = 0
}

public final class BenchmarkingExpoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function("nothing") {}
    Function("nothingOptimized", nothingOptimized())

    AsyncFunction("nothingAsync") { () async -> Void in }

    // MARK: - Numbers

    Function("addNumbers") { (a: Double, b: Double) in
      return a + b
    }

    Function("addNumbersOptimized", addNumbersOptimized())

    AsyncFunction("addNumbersAsync") { (a: Double, b: Double) in
      return a + b
    }

    AsyncFunction("addNumbersAsyncOptimized", addNumbersOptimized())

    // MARK: - Strings

    Function("addStrings") { (a: String, b: String) in
      return a + b
    }

    Function("addStringsOptimized", addStringsOptimized())

    // MARK: - Arrays

    Function("foldArray") { (array: [Double]) in
      return array.reduce(0.0, +)
    }

    // MARK: - Passthrough

    Function("passthroughDict") { (point: [String: Any]) in
      return point
    }

    Function("passthroughRecord") { (point: Point) in
      return point
    }

    Function("passthroughSharedObject") { (point: SharedPoint) in
      return point
    }

    Class(SharedPoint.self) {
      Constructor { (x: Double, y: Double) -> SharedPoint in
        let point = SharedPoint()
        point.x = x
        point.y = y
        return point
      }

      Property("x") { (point: SharedPoint) in
        return point.x
      }

      Property("y") { (point: SharedPoint) in
        return point.y
      }
    }
  }

  @OptimizedFunction
  private func nothingOptimized() -> Void {}

  @OptimizedFunction
  private func addNumbersOptimized(a: Double, b: Double) throws -> Double {
    return a + b
  }

  @OptimizedFunction
  private func addStringsOptimized(a: String, b: String) throws -> String {
    return a + b
  }
}
