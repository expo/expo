import SwiftUI
import ExpoModulesCore

final class SecureFieldProps: UIBaseViewProps {
  @Field var defaultValue: String = ""
  @Field var autoFocus: Bool = false
  @Field var placeholder: String = ""
  var onValueChange = EventDispatcher()
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
    textManager.text = text
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
    SecureField(
      props.placeholder,
      text: $textManager.text
    )
      .focused($isFocused)
      .onAppear {
        textManager.text = props.defaultValue
        if props.autoFocus {
          isFocused = true
        }
      }
      .onChange(of: textManager.text) { newValue in
        props.onValueChange(["value": newValue])
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
