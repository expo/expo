// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SyncTextFieldProps: UIBaseViewProps {
  @Field var initialValue: String = ""
  var onStateInitialize = EventDispatcher()
}

struct SyncTextFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: SyncTextFieldProps
  @State private var stateId: Int

  init(props: SyncTextFieldProps) {
    self.props = props
    let id = SwiftUIStateRegistry.shared.createState(initialValue: props.initialValue)
    _stateId = State(initialValue: id)
    props.onStateInitialize(["stateId": id])
  }

  var body: some View {
    if let state = SwiftUIStateRegistry.shared.getState(id: stateId) {
      SyncTextFieldContent(state: state)
        .onDisappear {
          SwiftUIStateRegistry.shared.deleteState(id: stateId)
        }
    }
  }
}

private struct SyncTextFieldContent: View {
  @ObservedObject var state: SwiftUIState

  var body: some View {
    TextField("Enter text", text: state.binding(as: String.self, default: ""))
  }
}
