import SwiftUI
import ExpoModulesCore

final class SecureFieldProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

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
    )
      .modifier(CommonViewModifiers(props: props))
      .fixedSize(horizontal: false, vertical: true)
      .onAppear { textManager.text = props.defaultValue }
      .onChange(of: textManager.text) { newValue in
        props.onValueChanged(["value": newValue])
      }
      .keyboardType(getKeyboardType(props.keyboardType))
  }
}
