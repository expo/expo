import ExpoModulesCore
import ExpoModulesJSI

struct Point: Record {
  @Field
  var x: Double = 0

  @Field
  var y: Double = 0
}

@Record
struct SynthesizedPoint {
  var x: Double = 0
  var y: Double = 0
}

final class SharedPoint: SharedObject {
  var x: Double = 0
  var y: Double = 0
}

@ExpoModule
public final class BenchmarkingExpoModule: Module {
  public func definition() -> ModuleDefinition {
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

    // MARK: - runtime.execute() benchmarks
    //
    // Each benchmark times `iterations` round-trips of one of the four
    // `JavaScriptRuntime.execute(...)` overloads from a non-JS thread, returning
    // elapsed milliseconds. AsyncFunction bodies already run off the JS thread,
    // so calling `execute` here exercises the cross-thread scheduling + wakeup
    // path.
    //
    // The two non-async closures dispatch onto the GCD queue shared by Expo
    // Modules; the two async closures dispatch onto a Swift Concurrency
    // executor. Both call the same `RuntimeScheduler` underneath, but the
    // caller side differs.

    // Caller: GCD queue. Closure: sync.
    AsyncFunction("executeBlockingSync") { (iterations: Int) throws -> Double in
      let runtime = try self.appContext!.runtime
      let start = DispatchTime.now()
      for _ in 0..<iterations {
        try runtime.execute { () -> Void in
          _ = runtime.global().hasProperty("Math")
        }
      }
      return Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000
    }

    // Caller: GCD queue. Closure: async.
    AsyncFunction("executeBlockingAsync") { (iterations: Int) throws -> Double in
      let runtime = try self.appContext!.runtime
      let start = DispatchTime.now()
      for _ in 0..<iterations {
        try runtime.execute { @JavaScriptActor () async -> Void in
          _ = runtime.global().hasProperty("Math")
        }
      }
      return Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000
    }

    // Caller: Swift Concurrency (detached Task). Closure: sync.
    // The detached Task runs on the cooperative pool — off the JS thread — so
    // each `await runtime.execute(...)` exercises the cross-thread scheduling
    // path instead of the same-thread fast path.
    AsyncFunction("executeAsyncSync") { (iterations: Int, promise: Promise) in
      let runtime = try self.appContext!.runtime
      Task.detached {
        do {
          let start = DispatchTime.now()
          for _ in 0..<iterations {
            try await runtime.execute { () -> Void in
              _ = runtime.global().hasProperty("Math")
            }
          }
          let elapsedMs = Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000
          promise.resolve(elapsedMs)
        } catch {
          promise.reject(error)
        }
      }
    }

    // Caller: Swift Concurrency (detached Task). Closure: async.
    AsyncFunction("executeAsyncAsync") { (iterations: Int, promise: Promise) in
      let runtime = try self.appContext!.runtime
      Task.detached {
        do {
          let start = DispatchTime.now()
          for _ in 0..<iterations {
            try await runtime.execute { @JavaScriptActor () async -> Void in
              _ = runtime.global().hasProperty("Math")
            }
          }
          let elapsedMs = Double(DispatchTime.now().uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000
          promise.resolve(elapsedMs)
        } catch {
          promise.reject(error)
        }
      }
    }
  }

  @JS
  private func nothingSynthesized() -> Void {}

  @JS
  private func nothingAsyncSynthesized() async -> Void {}

  @OptimizedFunction
  private func nothingOptimized() -> Void {}

  @JS
  private func addNumbersSynthesized(a: Double, b: Double) throws -> Double {
    return a + b
  }

  @JS
  private func addNumbersAsyncSynthesized(a: Double, b: Double) async throws -> Double {
    return a + b
  }

  @OptimizedFunction
  private func addNumbersOptimized(a: Double, b: Double) throws -> Double {
    return a + b
  }

  @JS
  private func addStringsSynthesized(a: String, b: String) throws -> String {
    return a + b
  }

  @OptimizedFunction
  private func addStringsOptimized(a: String, b: String) throws -> String {
    return a + b
  }

  @JS
  private func foldArraySynthesized(array: [Double]) -> Double {
    return array.reduce(0.0, +)
  }

  @JS
  private func passthroughSynthesizedRecord(point: SynthesizedPoint) -> SynthesizedPoint {
    return point
  }
}
