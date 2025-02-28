import SwiftUI
import ExpoModulesCore
import Combine






class TextInputProps: ExpoSwiftUI.ViewProps {
  @Field var defaultValue: String = ""
  @Field var placeholder: String = ""
  @Field var multiline: Bool = false
  @Field var numberOfLines: Int?
  @Field var value: ValueBinding = ValueBinding("")
  @Field var keyboardType: String = "default"
  @Field var autocorrection: Bool = true
  var onValueChanged = EventDispatcher()
}

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


struct TextInputView: ExpoSwiftUI.View {
  @EnvironmentObject var props: TextInputProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  @State private var value: String = ""
//  @State var held: [AnyCancellable] = []
  
  
  var body: some View {
    ExpoSwiftUI.AutoSizingStack(shadowNodeProxy: shadowNodeProxy, axis: .vertical) {
      if #available(iOS 16.0, *) {
        TextField(props.placeholder, text: props.value.value, axis: props.multiline ? .vertical : .horizontal)
          .lineLimit(props.multiline ? props.numberOfLines : 1)

          .keyboardType(getKeyboardType(props.keyboardType))
          .autocorrectionDisabled(!props.autocorrection)
      } else {
        // Fallback on earlier versions
        Text("Unsupported iOS version. Please update your iOS version to use this feature.")
      }
    }
  }
}

