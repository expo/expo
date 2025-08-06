import SwiftUI
import ExpoModulesCore

final class SecureFieldProps: ExpoSwiftUI.ViewProps {
  @Field var defaultValue: String = ""
  @Field var placeholder: String = ""
  @Field var keyboardType: KeyboardType = KeyboardType.defaultKeyboard
  var onValueChanged = EventDispatcher()
}

struct SecureFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: SecureFieldProps
  @ObservedObject var textManager: TextFieldManager = TextFieldManager()

  init(props: SecureFieldProps) {
    self.props = props
  }

  func setText(_ text: String) {
    textManager.text = text
  }

  var body: some View {
    SecureField(
      props.placeholder,
      text: $textManager.text
    ).fixedSize(horizontal: false, vertical: true)
      .onAppear { textManager.text = props.defaultValue }
      .onChange(of: textManager.text) { newValue in
        props.onValueChanged(["value": newValue])
      }
      .keyboardType(getKeyboardType(props.keyboardType))
  }
}
