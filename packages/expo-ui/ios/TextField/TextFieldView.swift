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
  @Field var placeholder: String = ""
  @Field var multiline: Bool = false
  @Field var numberOfLines: Int?
  @Field var keyboardType: KeyboardType = KeyboardType.defaultKeyboard
  @Field var autocorrection: Bool = true
  @Field var allowNewlines: Bool = true
  @Field var autoFocus: Bool = false
  var onValueChanged = EventDispatcher()
  var onFocusChanged = EventDispatcher()
  var onSelectionChanged = EventDispatcher()
  var onSubmit = EventDispatcher()
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
  @Published var isFocused: Bool

  #if !os(tvOS)
  @Published var _selection: Any?
  @available(iOS 18.0, macOS 15.0, *)
  var selection: SwiftUI.TextSelection? {
    get { _selection as? SwiftUI.TextSelection }
    set { _selection = newValue }
  }
  #endif

  init(initialText: String = "") {
    self.text = initialText
    self.isFocused = false
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
  @ObservedObject var textManager: TextFieldManager = TextFieldManager()
  @FocusState private var isFocused: Bool

  init(props: TextFieldProps) {
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

  func setSelection(start: Int, end: Int) {
    #if !os(tvOS)
    if #available(iOS 18.0, macOS 15.0, *) {
      let lowerBound = min(start, end)
      let upperBound = max(start, end)
      let startIndex = textManager.text.index(textManager.text.startIndex, offsetBy: min(lowerBound, textManager.text.count))
      let endIndex = textManager.text.index(textManager.text.startIndex, offsetBy: min(upperBound, textManager.text.count))
      textManager.selection = SwiftUI.TextSelection(range: startIndex..<endIndex)
    }
    #endif
  }

  var text: some View {
    let text = if #available(iOS 18.0, macOS 15.0, tvOS 18.0, *) {
      #if !os(tvOS)
      TextField(
        props.placeholder,
        text: $textManager.text,
        selection: $textManager.selection,
        axis: (props.multiline && allowMultiLine()) ? .vertical : .horizontal
      )
      #else
      TextField(
        props.placeholder,
        text: $textManager.text,
        axis: (props.multiline && allowMultiLine()) ? .vertical : .horizontal
      )
      #endif
    } else if #available(iOS 16.0, tvOS 16.0, *) {
      TextField(
        props.placeholder,
        text: $textManager.text,
        axis: (props.multiline && allowMultiLine()) ? .vertical : .horizontal
      )
    } else {
      TextField(
        props.placeholder,
        text: $textManager.text
      )
    }
    return text.lineLimit((props.multiline && allowMultiLine()) ? props.numberOfLines : 1)
      .modifier(CommonViewModifiers(props: props))
      .fixedSize(horizontal: false, vertical: true)
      .keyboardType(getKeyboardType(props.keyboardType))
      .autocorrectionDisabled(!props.autocorrection)
      .focused($isFocused)
      .onSubmit({
        if props.allowNewlines && props.multiline && allowMultiLine() {
          if textManager.text.filter({ $0 == "\n" }).count < props.numberOfLines ?? Int.max - 1 {
            textManager.text.append("\n")

            // when selection state is set, the cursor does not auto update to added newline
            #if !os(tvOS)
            if #available(iOS 18.0, macOS 15.0, *) {
              let cursorPosition = textManager.text.endIndex
              textManager.selection = SwiftUI.TextSelection(range: cursorPosition..<cursorPosition)
            }
            #endif
          }
          isFocused = true
        }
        props.onSubmit(["value": textManager.text])
      })
  }

  var body: some View {
    let baseView = text
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

    #if !os(tvOS)
    if #available(iOS 18.0, macOS 15.0, *) {
      return baseView.onChange(of: textManager.selection) {
        if let selection = textManager.selection {
          if case let .selection(range) = selection.indices {
            let clampedLower = range.lowerBound < textManager.text.endIndex ? range.lowerBound : textManager.text.endIndex
            let clampedUpper = range.upperBound < textManager.text.endIndex ? range.upperBound : textManager.text.endIndex

            let start = textManager.text.distance(from: textManager.text.startIndex, to: clampedLower)
            let end = textManager.text.distance(from: textManager.text.startIndex, to: clampedUpper)
            props.onSelectionChanged(["start": start, "end": end])
          }
        }
      }
    } else {
      return baseView
    }
    #else
    return baseView
    #endif
  }
}
