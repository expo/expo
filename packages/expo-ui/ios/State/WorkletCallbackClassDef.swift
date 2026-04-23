// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoModulesWorklets

/**
 Kept in a dedicated file to work around a Swift 6.3.1 compiler crash that fires
 when `import ExpoModulesWorklets` lives in the same file as a `Class(...)` DSL
 call while ExpoModulesCore is consumed as its precompiled xcframework. Hosting
 this definition here — behind a function with an explicit return type — lets the
 module-emit step skip the body and keeps ExpoUIModule.swift free of the import.
 */
internal func makeWorkletCallbackClass() -> ClassDefinition {
  Class(WorkletCallback.self) {
    Constructor { (worklet: Worklet) -> WorkletCallback in
      let callback = WorkletCallback()
      callback.worklet = worklet
      return callback
    }
  }
}
