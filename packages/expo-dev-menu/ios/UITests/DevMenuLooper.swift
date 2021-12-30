import Foundation
import XCTest

class DevMenuLooper {
  static func runMainLoop(for sec: Double) {
    RunLoop.main.run(mode: .default, before: Date(timeIntervalSinceNow: sec))
    RunLoop.main.run(mode: .common, before: Date(timeIntervalSinceNow: sec))
    RunLoop.main.run(mode: .tracking, before: Date(timeIntervalSinceNow: sec))
  }

  static func runMainLoopUntilEmpty() {
    var isEmpty = false

    DispatchQueue.main.async {
      isEmpty = true
    }

    let timout = Date(timeIntervalSinceNow: DevMenuTestOptions.defaultTimeout)
    while timout.timeIntervalSinceNow > 0 {
      if isEmpty {
        return
      }

      DevMenuLooper.runMainLoop(for: DevMenuTestOptions.loopTime)
    }

    XCTFail("Wait for main thread timeout.")
  }
}
