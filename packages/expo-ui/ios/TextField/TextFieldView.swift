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

final class TextFieldProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var defaultValue: String = ""
  @Field var value: String = ""
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

class TextFieldManager: ObservableObject {
  @Published var text: String

  init(initialText: String = "") {
    self.text = initialText
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
  @State private var valueStateChangedInJS: Bool = false;
  @FocusState private var isFocused: Bool
  @State private var valueState = "idle"
  @State private var previousNewValue: String = "";
  @State private var refreshBinding = false

  init(props: TextFieldProps) {
    self.props = props
  }
  
  var text: some View {
    let text = TextField(
        props.placeholder,
        text: Binding(
          get: {
            _ = valueState;
            return props.value
          },
          set: { newValue in
            if (valueState == "pending") {
              return
            }
            if (props.value == newValue) {
              return;
            }
            
            // Weird behaviour where this callback gets called twice. Debug
            if (previousNewValue != newValue) {
              previousNewValue = newValue
            } else {
              return;
            }
            valueState = "pending"
            
            props.onValueChanged(["value": newValue])
            
            while valueState == "pending" {
              RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.001))
            }
          }
        ),
      )
    
    return text.lineLimit((props.multiline && allowMultiLine()) ? props.numberOfLines : 1)
      .modifier(CommonViewModifiers(props: props))
      .fixedSize(horizontal: false, vertical: true)
      .keyboardType(getKeyboardType(props.keyboardType))
      .autocorrectionDisabled(!props.autocorrection)
      .if(props.allowNewlines, {
        $0.focused($isFocused).onSubmit({
          if props.value.filter({ $0 == "\n" }).count < props.numberOfLines ?? Int.max - 1 {
            props.onValueChanged(["value": props.value + "\n"])
          }
          isFocused = true
        })
      })
  }

  var body: some View {
    text
      .onChange(of: props.value) { newValue in
        valueState = "idle"
      }
  }
}
