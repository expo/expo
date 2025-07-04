import SwiftUI
import ExpoModulesCore

final class SecureFieldProps: ExpoSwiftUI.ViewProps {
  @Field var defaultValue: String = ""
  @Field var placeholder: String = ""
  @Field var keyboardType: String = "default"
  var onValueChanged = EventDispatcher()
}

struct SecureFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: SecureFieldProps
  @State private var value: String = ""
  @FocusState private var isFocused: Bool

  init(props: SecureFieldProps) {
    self.props = props
  }

  var body: some View {
    SecureField(
      props.placeholder,
      text: $value
    ).fixedSize(horizontal: false, vertical: true)
      .onAppear { value = props.defaultValue }
      .onChange(of: value) { newValue in
        props.onValueChanged(["value": newValue])
      }
      .keyboardType(getKeyboardType(props.keyboardType))
  }
}
