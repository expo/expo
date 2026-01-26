// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SyncTextFieldProps: UIBaseViewProps {
  @Field var viewId: String?
  @Field var defaultValue: String = ""
}

struct SyncTextFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: SyncTextFieldProps
  @State private var text: String = ""

  private var stateManager: ViewStateManager? {
    ViewStateManager(viewId: props.viewId, appContext: props.appContext)
  }

  var body: some View {
    TextField("Enter text", text: $text)
      .onChange(of: text) { newValue in
        guard let stateManager else { return }
        let jsValue = JavaScriptValue.string(newValue, runtime: stateManager.uiRuntime)
        if let result = stateManager.callOnChange(jsValue) {
          let transformed = result.getString()
          if transformed != newValue {
            text = transformed
          }
        }
      }
      .onAppear {
        text = props.defaultValue
        guard let stateManager else { return }
        stateManager.register(
          getState: { JavaScriptValue.string(text, runtime: stateManager.uiRuntime) },
          setState: { text = $0.getString() }
        )
      }
      .onDisappear {
        stateManager?.cleanup()
      }
  }
}
