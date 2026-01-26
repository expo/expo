// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SyncTextFieldProps: UIBaseViewProps {
  @Field var stateId: Double?
}

struct SyncTextFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: SyncTextFieldProps

  var body: some View {
    if let stateId = props.stateId,
       let state = SwiftUIStateRegistry.shared.getState(id: Int(stateId)) {
      SyncTextFieldContent(state: state)
    }
  }
}

private struct SyncTextFieldContent: View {
  @ObservedObject var state: SwiftUIState

  var body: some View {
    TextField("Enter text", text: state.binding(as: String.self, default: ""))
  }
}
