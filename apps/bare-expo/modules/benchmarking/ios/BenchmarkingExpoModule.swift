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

    AsyncFunction("nothingAsync") { () async -> Void in }

    // MARK: - Numbers

    Function("addNumbers") { (a: Double, b: Double) in
      return a + b
    }

    Function("addNumbersOptimized", addNumbersOptimized)

    AsyncFunction("addNumbersAsync") { (a: Double, b: Double) in
      return a + b
    }

    AsyncFunction("addNumbersAsyncOptimized", addNumbersAsyncOptimized)

    // MARK: - Strings

    Function("addStrings") { (a: String, b: String) in
      return a + b
    }

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
}
