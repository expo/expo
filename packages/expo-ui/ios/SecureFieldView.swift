import SwiftUI
import ExpoModulesCore

final class SecureFieldProps: UIBaseViewProps {
  @Field var text: ObservableState?
  @Field var autoFocus: Bool = false
  @Field var placeholder: String = ""
  @Field var onTextChangeSync: WorkletCallback?
  var onTextChange = EventDispatcher()
  var onFocusChange = EventDispatcher()
}

struct SecureFieldView: ExpoSwiftUI.View, ExpoSwiftUI.FocusableView {
  @ObservedObject var props: SecureFieldProps
  @ObservedObject var textManager: TextFieldManager = TextFieldManager()
  @FocusState private var isFocused: Bool

  init(props: SecureFieldProps) {
    self.props = props
  }

  func setText(_ text: String) {
    props.text?.value = text
  }

  func focus() {
    textManager.isFocused = true
  }

  func blur() {
    textManager.isFocused = false
  }

  func forceResignFirstResponder() {
    if textManager.isFocused {
      UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

    textManager.isFocused = false
    isFocused = false
  }

  var body: some View {
    if let state = props.text {
      StatefulSecureField(
        state: state,
        props: props,
        textManager: textManager,
        isFocused: $isFocused
      )
    }
  }
}

private struct StatefulSecureField: View {
  @ObservedObject var state: ObservableState
  @ObservedObject var props: SecureFieldProps
  @ObservedObject var textManager: TextFieldManager
  @FocusState.Binding var isFocused: Bool

  var body: some View {
    let textBinding = state.binding("")
    SecureField(
      props.placeholder,
      text: textBinding
    )
      .focused($isFocused)
      .onAppear {
        if props.autoFocus {
          isFocused = true
        }
      }
      .onChange(of: state.value as? String) { newValue in
        props.onTextChange(["value": newValue])
        props.onTextChangeSync?.invoke(arguments: [newValue])
      }
      .onChange(of: textManager.isFocused) { newValue in
        isFocused = newValue
      }
      .onChange(of: isFocused) { newValue in
        textManager.isFocused = newValue
        props.onFocusChange(["value": newValue])
      }
  }
}
