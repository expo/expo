// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

/// Helper for managing view state on the UI runtime global
struct ViewStateManager {
  let viewId: String
  weak var uiRuntime: WorkletRuntime?

  init?(viewId: String?, appContext: AppContext?) {
    guard let viewId,
          let appContext,
          let uiRuntime = try? appContext.uiRuntime else {
      return nil
    }
    self.viewId = viewId
    self.uiRuntime = uiRuntime
  }

  private var global: JavaScriptObject? { uiRuntime?.global() }

  private var registry: JavaScriptObject? {
    guard let global, global.hasProperty("__expoSwiftUIState") else { return nil }
    return global.getProperty("__expoSwiftUIState").getObject()
  }

  private var viewState: JavaScriptObject? {
    guard let registry, registry.hasProperty(viewId) else { return nil }
    return registry.getProperty(viewId).getObject()
  }

  // MARK: - Setup & Cleanup

  func register(getState: @escaping () -> JavaScriptValue, setState: @escaping (JavaScriptValue) -> Void) {
    guard let uiRuntime, let global else { return }

    // Ensure registry exists
    if !global.hasProperty("__expoSwiftUIState") {
      global.setProperty("__expoSwiftUIState", value: uiRuntime.createObject())
    }

    let registry = global.getProperty("__expoSwiftUIState").getObject()
    let viewState = uiRuntime.createObject()

    let getStateFn = uiRuntime.createSyncFunction("getState", argsCount: 0) { _, _ in
      getState()
    }

    let setStateFn = uiRuntime.createSyncFunction("setState", argsCount: 1) { _, args in
      if let value = args.first {
        setState(value)
      }
      return JavaScriptValue.undefined
    }

    viewState.setProperty("getState", value: getStateFn)
    viewState.setProperty("setState", value: setStateFn)
    registry.setProperty(viewId, value: viewState)
  }

  func cleanup() {
    _ = try? uiRuntime?.eval("delete globalThis.__expoSwiftUIState?.['\(viewId)']")
  }

  // MARK: - onChange

  func callOnChange(_ value: JavaScriptValue) -> JavaScriptValue? {
    guard let viewState,
          viewState.hasProperty("onChange"),
          viewState.getProperty("onChange").isFunction() else {
      return nil
    }

    let onChange = viewState.getProperty("onChange").getFunction()
    let result = onChange.call(withArguments: [value], thisObject: nil, asConstructor: false)

    return result.isUndefined() ? nil : result
  }
}
