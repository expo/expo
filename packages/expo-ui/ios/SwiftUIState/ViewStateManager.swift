// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

/// Helper for managing view state on the UI runtime global
struct ViewStateManager {
  let viewId: String
  let uiRuntime: WorkletRuntime

  init?(viewId: String?, appContext: AppContext?) {
    guard let viewId,
          let appContext,
          let uiRuntime = try? appContext.uiRuntime else {
      return nil
    }
    self.viewId = viewId
    self.uiRuntime = uiRuntime
  }

  private var global: JavaScriptObject { uiRuntime.global() }

  private var registry: JavaScriptObject? {
    guard global.hasProperty("__expoSwiftUIState") else { return nil }
    return global.getProperty("__expoSwiftUIState").getObject()
  }

  private var viewState: JavaScriptObject? {
    guard let registry, registry.hasProperty(viewId) else { return nil }
    return registry.getProperty(viewId).getObject()
  }

  // MARK: - Setup & Cleanup

  func register(getState: @escaping () -> String, setState: @escaping (String) -> Void) {
    // Ensure registry exists
    if !global.hasProperty("__expoSwiftUIState") {
      global.setProperty("__expoSwiftUIState", value: uiRuntime.createObject())
    }

    let registry = global.getProperty("__expoSwiftUIState").getObject()
    let viewState = uiRuntime.createObject()

    let getStateFn = uiRuntime.createSyncFunction("getState", argsCount: 0) { _, _ in
      JavaScriptValue.string(getState(), runtime: uiRuntime)
    }

    let setStateFn = uiRuntime.createSyncFunction("setState", argsCount: 1) { _, args in
      if let newValue = args.first?.getString() {
        setState(newValue)
      }
      return JavaScriptValue.undefined
    }

    viewState.setProperty("getState", value: getStateFn)
    viewState.setProperty("setState", value: setStateFn)
    registry.setProperty(viewId, value: viewState)
  }

  func cleanup() {
    _ = try? uiRuntime.eval("delete globalThis.__expoSwiftUIState?.['\(viewId)']")
  }

  // MARK: - onChange

  func callOnChange(_ value: String) -> String? {
    guard let viewState,
          viewState.hasProperty("onChange"),
          viewState.getProperty("onChange").isFunction() else {
      return nil
    }

    let onChange = viewState.getProperty("onChange").getFunction()
    let jsValue = JavaScriptValue.string(value, runtime: uiRuntime)
    let result = onChange.call(withArguments: [jsValue], thisObject: nil, asConstructor: false)

    if !result.isUndefined() {
      return result.getString()
    }
    return nil
  }
}
