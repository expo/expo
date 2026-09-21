import ExpoModulesCore

struct ProgressRecord: Record {
  @Field var percent: Double = 0.0
  @Field var stage: String = ""
}

enum DownloadStage: String, Enumerable {
  case started
  case downloading
  case completed
}

@ExpoModule("CallbackTest")
public final class CallbackTestModule: Module {
  public func definition() -> ModuleDefinition {
    Function("callWithInt") { (callback: Callback) in
      callback(42)
    }

    Function("callMultiple") { (callback: Callback) in
      callback(1)
      callback(2)
      callback(3)
    }

    Function("callWithRecord") { (callback: Callback) in
      let progress = ProgressRecord()
      progress.percent = 0.75
      progress.stage = "downloading"
      callback(progress)
    }

    Function("callWithEnum") { (callback: Callback) in
      callback(DownloadStage.completed)
    }

    Function("greetWithCallback") { (name: String, callback: Callback) in
      callback("Hello, \(name)!")
    }

    AsyncFunction("simulateDownload") { (callback: Callback) in
      for step in 0...4 {
        let percent = Double(step) / 4.0
        let stage = switch step {
        case 0: "started"
        case 4: "completed"
        default: "downloading"
        }
        callback(["stage": stage, "percent": percent])
        if step < 4 {
          try await Task.sleep(nanoseconds: 300_000_000)
        }
      }
    }

    // Two Callback parameters in one function.
    Function("callWithTwoCallbacks") { (onProgress: Callback, onDone: Callback) in
      onProgress(0.5)
      onDone("finished")
    }

    // A nullable Callback: DynamicOptionalType wrapping DynamicCallbackType.
    Function("callOptional") { (callback: Callback?) in
      callback?("provided")
    }

    Function("callWithArray") { (callback: Callback) in
      callback([1, 2, 3])
    }

    Function("callWithMap") { (callback: Callback) in
      callback(["name": "expo", "version": 58])
    }

    Function("callWithMixedArgs") { (callback: Callback) in
      callback(true, 3.14, "text", ["a", "b"])
    }

    Function("callWithNull") { (callback: Callback) in
      callback(nil as String?)
    }

    // A callback and a promise result in the same call.
    AsyncFunction("simulateDownloadWithResult") { (callback: Callback) -> String in
      for percent in [0.0, 0.5, 1.0] {
        callback(percent)
        if percent < 1.0 {
          try await Task.sleep(nanoseconds: 200_000_000)
        }
      }
      return "complete"
    }

    Function("callFromBackgroundThread") { (callback: Callback) in
      DispatchQueue.global().async {
        callback("from background")
      }
    }

    Function("callWithRecordAndCallback") { (options: ProgressRecord, callback: Callback) in
      callback(options)
    }
  }

  // Exercises the @JS decode path.
  @JS
  func simulateDownloadJS(onProgress: Callback) async throws {
    for step in 0...2 {
      onProgress(Double(step) / 2.0)
      try await Task.sleep(nanoseconds: 200_000_000)
    }
  }
}
