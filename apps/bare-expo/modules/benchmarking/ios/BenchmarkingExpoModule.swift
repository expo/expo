import ExpoModulesCore

public final class BenchmarkingExpoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BenchmarkingExpoModule")

    Function("nothing") {}

    Function("addNumbers") { (a: Double, b: Double) in
      return a + b
    }

    Function("addStrings") { (a: String, b: String) in
      return a + b
    }

    Function("foldArray") { (array: [Double]) in
      return array.reduce(0.0, +)
    }

    AsyncFunction("asyncAddNumbers") { (a: Double, b: Double) in
      return a + b
    }

    AsyncFunction("concurrentAddNumbers") { (a: Double, b: Double) async in
      return a + b
    }
  }
}
