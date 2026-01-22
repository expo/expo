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

    if let uiRuntime = try? props.appContext?.uiRuntime,
       let expoNativeState = try? uiRuntime.global().getProperty("ExpoNativeState").asObject(),
       let createFn = try? expoNativeState.getProperty("create").asFunction() {
      createFn.call(withArguments: [stateId, initialValue], thisObject: nil, asConstructor: false)
    }
    self._state = StateObject(wrappedValue: NativeStateRegistry.shared.getState(id: stateId)!)
  }

  var body: some View {
    TextField(placeholder, text: $state.value)
      .modifier(UIBaseViewModifier(props: props))
      .onChange(of: state.value) { newValue in
        guard let uiRuntime = try? props.appContext?.uiRuntime else { return }
        guard let expoNativeState = try? uiRuntime.global().getProperty("ExpoNativeState").asObject() else { return }
        guard let stateObj = try? expoNativeState.getProperty(stateId).asObject() else { return }
        if let onChange = try? stateObj.getProperty("onChange").asFunction() {
          onChange.call(withArguments: [newValue], thisObject: nil, asConstructor: false)
        }
      }
      .onDisappear {
        NativeStateRegistry.shared.deleteState(id: stateId)
      }
  }
}
