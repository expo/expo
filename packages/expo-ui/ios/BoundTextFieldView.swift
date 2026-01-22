import SwiftUI
import ExpoModulesCore

final class BoundTextFieldProps: UIBaseViewProps {
  @Field var stateId: String = ""
  @Field var initialValue: String = ""
  @Field var placeholder: String = ""
}

struct BoundTextFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: BoundTextFieldProps
  @State private var previousStateId: String = ""

  var body: some View {
    BoundTextFieldInner(
      stateId: props.stateId,
      initialValue: props.initialValue,
      placeholder: props.placeholder,
      props: props
    )
    .onChange(of: props.stateId) { newId in
      if !previousStateId.isEmpty && previousStateId != newId {
        NativeStateRegistry.shared.deleteState(id: previousStateId)
      }
      previousStateId = newId
    }
  }
}

private struct BoundTextFieldInner: View {
  let stateId: String
  let initialValue: String
  let placeholder: String
  let props: BoundTextFieldProps
  @StateObject private var state: NativeState

  init(stateId: String, initialValue: String, placeholder: String, props: BoundTextFieldProps) {
    self.stateId = stateId
    self.initialValue = initialValue
    self.placeholder = placeholder
    self.props = props
    NativeStateRegistry.shared.createState(id: stateId, initialValue: initialValue)
    self._state = StateObject(wrappedValue: NativeStateRegistry.shared.getState(id: stateId)!)
  }

  var body: some View {
    TextField(placeholder, text: $state.value)
      .modifier(UIBaseViewModifier(props: props))
      .onChange(of: state.value) { newValue in
        guard let uiRuntime = try? props.appContext?.uiRuntime else { return }
        let escaped = newValue.replacingOccurrences(of: "\\", with: "\\\\")
          .replacingOccurrences(of: "'", with: "\\'")
          .replacingOccurrences(of: "\n", with: "\\n")
        let code = "global.ExpoNativeStateCallbacks?.['\(stateId)']?.('\(escaped)')"
        try? uiRuntime.eval(code)
      }
      .onDisappear {
        NativeStateRegistry.shared.deleteState(id: stateId)
      }
  }
}
