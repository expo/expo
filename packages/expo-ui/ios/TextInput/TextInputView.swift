import SwiftUI
import ExpoModulesCore

func getKeyboardType(_ keyboardType: String?) -> UIKeyboardType {
  switch keyboardType ?? "" {
  case "default":
    return .default
  case "email-address":
    return .emailAddress
  case "numeric":
    return .numberPad
  case "phone-pad":
    return .phonePad
  case "ascii-capable":
    return .asciiCapable
  case "numbers-and-punctuation":
    return .numbersAndPunctuation
  case "url":
    return .URL
  case "name-phone-pad":
    return .namePhonePad
  case "decimal-pad":
    return .decimalPad
  case "twitter":
    return .twitter
  case "web-search":
    return .webSearch
  case "ascii-capable-number-pad":
    return .asciiCapableNumberPad
  default:
    return .default
  }
}

//https://www.w3.org/TR/css-fonts-3/  section 3.2
func getFontWeight(_ type: String) -> Font.Weight{
    switch Int(type){
    case 100:
      return .thin
    case 200:
      return .ultraLight
    case 300:
      return .light
    case 400:
      return .regular
    case 500:
      return .medium
    case 600:
      return .semibold
    case 700:
      return .bold
    case 800:
      return .black
    case 900:
      return .heavy
    default:
      return .regular
    }
}

struct TextInputView: ExpoSwiftUI.View {
  @ObservedObject var props: TextInputProps
  @FocusState private var isFocused: Bool
  @State private var value: String = ""

  init(props: TextInputProps) {
    self.props = props
  }

  var body: some View {
      
    let maskFormatter = MaskFormatter(mask: props.mask ?? "")
      
    if props.secureEntry{
        SecureField(props.placeholder, text: $value)
            .onChange(of: value) { newValue in
              props.onValueChanged(["value": "newValue"])
            }
            .applyTextStyle(props.style)
            .focused($isFocused)
            .onChange(of: isFocused) { isFocused in
                if isFocused{
                    props.onTextFieldFocus()
                }else{
                    props.onTextFieldBlur()
                }
            }
    }else{
        if #available(iOS 16.0, tvOS 16.0, *) {
          TextField(
            props.placeholder,
            text: $value,
            axis: (props.multiline && allowMultiLine()) ? .vertical : .horizontal)
            .disabled(!props.editable)
            .lineLimit((props.multiline && allowMultiLine()) ? props.numberOfLines : 1)
            .fixedSize(horizontal: false, vertical: true)
            .focused($isFocused)
            .onAppear { value = props.defaultValue }
            .onChange(of: value) { newValue in
              if let mask = props.mask{
                  value = maskFormatter.applyMask(text: newValue,mask:mask)
              }
              props.onValueChanged(["value": "newValue"])
            }
            .onChange(of: isFocused) { isFocused in
                if isFocused{
                    props.onTextFieldFocus()
                }else{
                    props.onTextFieldBlur()
                }
            }
            .applyTextStyle(props.style)
            .keyboardType(getKeyboardType(props.keyboardType))
            .autocorrectionDisabled(!props.autocorrection)
            .accessibilityIdentifier(props.testID)
        } else {
          // Fallback on earlier versions
          Text("Unsupported iOS version. Please update your iOS version to use this feature.")
        }
    }
  }
}
