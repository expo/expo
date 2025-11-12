import SwiftUI
import ExpoModulesCore

final class SecureFieldProps: UIBaseViewProps {
  @Field var defaultValue: String = ""
  @Field var placeholder: String = ""
  @Field var keyboardType: KeyboardType = KeyboardType.defaultKeyboard
  @Field var autoFocus: Bool = false
  var onValueChanged = EventDispatcher()
  var onFocusChanged = EventDispatcher()
  var onSubmit = EventDispatcher()
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
    guard textManager.isFocused else {
      return
    }
    #if os(iOS) || os(tvOS)
    // When the view is unmounted, the focus on TextInput stays active and it causes a crash, so we blur it using endEditing. Setting `isFocused` does not work
    // https://github.com/expo/expo/issues/40354
    if let keyWindow = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) {
      keyWindow.endEditing(true)
    }
    #endif
    textManager.isFocused = false
    isFocused = false
  }

  var body: some View {
    SecureField(
      props.placeholder,
      text: $textManager.text
    )
      .modifier(UIBaseViewModifier(props: props))
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
