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
        if let transformed = stateManager?.callOnChange(newValue), transformed != newValue {
          text = transformed
        }
      }
      .onAppear {
        text = props.defaultValue
        stateManager?.register(
          getState: { text },
          setState: { text = $0 }
        )
      }
      .onDisappear {
        stateManager?.cleanup()
      }
  }
}
