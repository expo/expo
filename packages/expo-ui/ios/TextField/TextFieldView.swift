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

class TextFieldState: ObservableObject {
  @Published var valueState = "idle"
  @Published var tempValue = ""
  @Published var previousNewValue = ""
}

struct TextFieldView: ExpoSwiftUI.View {
  @ObservedObject var props: TextFieldProps
  @ObservedObject private var textFieldState: TextFieldState
  @State private var valueStateChangedInJS: Bool = false;
  @FocusState private var isFocused: Bool
  
  public func resetControlledState() {
    self.textFieldState.valueState = "idle"
  }

  init(props: TextFieldProps) {
    self.props = props
    self.textFieldState = TextFieldState()
  }
  
  var text: some View {
    let text = TextField(
        props.placeholder,
        text: $textFieldState.tempValue,
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
    print("Body rendering with tempValue: '\(textFieldState.tempValue)', valueState: '\(textFieldState.valueState)'")
    return text
      .onChange(of: props.value) { newValue in
        print("changed")
        textFieldState.valueState = "idle"
        textFieldState.tempValue = props.value
      }
      .onChange(of: textFieldState.tempValue) { newValue in
        if (textFieldState.valueState == "pending") {
          textFieldState.tempValue = props.value
          return
        }
        
        // means above call has set it
        if (newValue == props.value) {
          textFieldState.tempValue = newValue
          return
        }
      
        // call reached here means user has typed it
        // set it to existing props value
        textFieldState.tempValue = props.value
        props.onValueChanged(["value": newValue])
        textFieldState.valueState = "pending"
      }
  }
}
