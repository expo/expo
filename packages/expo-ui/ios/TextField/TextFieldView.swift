import SwiftUI
import ExpoModulesCore

enum KeyboardType: String, Enumerable {
  case defaultKeyboard = "default"
  case emailAddress = "email-address"
  case numeric = "numeric"
  case phonePad = "phone-pad"
  case asciiCapable = "ascii-capable"
  case numbersAndPunctuation = "numbers-and-punctuation"
  case url = "url"
  case namePhonePad = "name-phone-pad"
  case decimalPad = "decimal-pad"
  case twitter = "twitter"
  case webSearch = "web-search"
  case asciiCapableNumberPad = "ascii-capable-number-pad"
}

final class TextFieldProps: ExpoSwiftUI.ViewProps {
  @Field var defaultValue: String = ""
  @Field var placeholder: String = ""
  @Field var multiline: Bool = false
  @Field var numberOfLines: Int?
  @Field var keyboardType: KeyboardType = KeyboardType.defaultKeyboard
  @Field var autocorrection: Bool = true
  @Field var allowNewlines: Bool = true
  var onValueChanged = EventDispatcher()
}

func getKeyboardType(_ keyboardType: KeyboardType?) -> UIKeyboardType {
  guard let keyboardType = keyboardType else {
    return .default
  }
  switch keyboardType {
  case .defaultKeyboard:
    return .default
  case .emailAddress:
    return .emailAddress
  case .numeric:
    return .numberPad
  case .phonePad:
    return .phonePad
  case .asciiCapable:
    return .asciiCapable
  case .numbersAndPunctuation:
    return .numbersAndPunctuation
  case .url:
    return .URL
  case .namePhonePad:
    return .namePhonePad
  case .decimalPad:
    return .decimalPad
  case .twitter:
    return .twitter
  case .webSearch:
    return .webSearch
  case .asciiCapableNumberPad:
    return .asciiCapableNumberPad
  }
}

func allowMultiLine() -> Bool {
  #if os(tvOS)
  return false
  #else
  return true
  #endif
}

struct TextFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: TextFieldProps
  @State private var value: String = ""
  @FocusState private var isFocused: Bool

  init(props: TextFieldProps) {
    self.props = props
  }

  var body: some View {
    let text = if #available(iOS 16.0, tvOS 16.0, *) {
      TextField(
        props.placeholder,
        text: $value,
        axis: (props.multiline && allowMultiLine()) ? .vertical : .horizontal
      )
    } else {
      TextField(
        props.placeholder,
        text: $value
      )
    }
    text.lineLimit((props.multiline && allowMultiLine()) ? props.numberOfLines : 1)
      .fixedSize(horizontal: false, vertical: true)
      .onAppear { value = props.defaultValue }
      .onChange(of: value) { newValue in
        props.onValueChanged(["value": newValue])
      }
      .keyboardType(getKeyboardType(props.keyboardType))
      .autocorrectionDisabled(!props.autocorrection)
      .if(props.allowNewlines, {
        $0.focused($isFocused).onSubmit({
          if value.filter({ $0 == "\n" }).count < props.numberOfLines ?? Int.max - 1 {
            value.append("\n")
          }
          isFocused = true
        })
      })
  }
}
