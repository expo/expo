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
  @Field var autoFocus: Bool = false
  var onValueChanged = EventDispatcher()
  var onFocusChanged = EventDispatcher()
  var onSubmit = EventDispatcher()
}

struct SecureFieldView: ExpoSwiftUI.View {
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

  var body: some View {
    SecureField(
      props.placeholder,
      text: $textManager.text
    )
      .modifier(CommonViewModifiers(props: props))
      .fixedSize(horizontal: false, vertical: true)
      .focused($isFocused)
      .onSubmit({
        props.onSubmit(["value": textManager.text])
      })
      .onAppear {
        textManager.text = props.defaultValue
        if props.autoFocus {
          isFocused = true
        }
      }
      .onChange(of: textManager.text) { newValue in
        props.onValueChanged(["value": newValue])
      }
      .onChange(of: textManager.isFocused) { newValue in
        isFocused = newValue
      }
      .onChange(of: isFocused) { newValue in
        textManager.isFocused = newValue
        props.onFocusChanged(["value": newValue])
      }
      .keyboardType(getKeyboardType(props.keyboardType))
  }
}
