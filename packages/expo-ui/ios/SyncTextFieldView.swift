// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class SyncTextFieldProps: UIBaseViewProps {
  @Field var viewId: String?
  @Field var defaultValue: String = ""
}

internal final class TextFieldState: ObservableObject {
  @Published var text: String = ""
  var stateManager: ViewStateManager?
}

internal struct SyncTextFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: SyncTextFieldProps
  @StateObject private var state = TextFieldState()

  var body: some View {
    TextField("Enter text", text: $state.text)
      .onChange(of: state.text) { newValue in
        guard let runtime = state.stateManager?.uiRuntime else { return }
        let jsValue = JavaScriptValue.string(newValue, runtime: runtime)
        if let result = state.stateManager?.callOnChange(jsValue) {
          let transformed = result.getString()
          if transformed != newValue {
            state.text = transformed
          }
        }
      }
      .onAppear {
        state.text = props.defaultValue
        state.stateManager = ViewStateManager(viewId: props.viewId, appContext: props.appContext)

        guard let stateManager = state.stateManager else { return }

        weak var weakState = state
        weak var weakRuntime = stateManager.uiRuntime

        stateManager.register(
          getState: {
            guard let state = weakState, let runtime = weakRuntime else {
              return JavaScriptValue.undefined
            }
            return JavaScriptValue.string(state.text, runtime: runtime)
          },
          setState: {
            weakState?.text = $0.getString()
          }
        )
      }
      .onDisappear {
        state.stateManager?.cleanup()
      }
  }
}
