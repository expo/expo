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

public class CallbackTestModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CallbackTest")

    Function("callWithInt") { (callback: JSCallback) in
      callback(42)
    }

    Function("callMultiple") { (callback: JSCallback) in
      callback(1)
      callback(2)
      callback(3)
    }

    Function("callWithRecord") { (callback: JSCallback) in
      let progress = ProgressRecord()
      progress.percent = 0.75
      progress.stage = "downloading"
      callback(progress)
    }

    Function("callWithEnum") { (callback: JSCallback) in
      callback(DownloadStage.completed)
    }

    AsyncFunction("simulateDownload") { (callback: JSCallback) in
      for i in 0...4 {
        let percent = Double(i) / 4.0
        let stage = switch i {
          case 0: "started"
          case 4: "completed"
          default: "downloading"
        }
        callback(["stage": stage, "percent": percent])
        if i < 4 {
          try await Task.sleep(nanoseconds: 300_000_000)
        }
      }
    }

    Function("greetWithCallback") { (name: String, callback: JSCallback) in
      callback("Hello, \(name)!")
    }
  }
}
