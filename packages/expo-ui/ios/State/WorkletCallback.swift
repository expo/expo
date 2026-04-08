// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoModulesWorklets

/**
 A SharedObject that wraps a Worklet function.
 Passable as a view prop via integer ID — survives React's prop serialization.
 The view resolves it and executes the worklet on the UI runtime.
 */
internal final class WorkletCallback: SharedObject {
  var worklet: Worklet?

  func invoke(arguments: [Any] = []) {
    guard let worklet, let runtime = appContext?._uiRuntime as? WorkletRuntime else {
      return
    }
    worklet.execute(on: runtime, arguments: arguments)
  }
}
