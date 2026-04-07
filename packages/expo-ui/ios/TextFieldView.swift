import SwiftUI
import ExpoModulesCore

enum TextFieldAxis: String, Enumerable {
  case horizontal
  case vertical
}

final class TextFieldProps: UIBaseViewProps {
  @Field var defaultValue: String = ""
  @Field var autoFocus: Bool = false
  @Field var placeholder: String = ""
  @Field var axis: TextFieldAxis = .horizontal
  var onValueChange = EventDispatcher()
  var onFocusChange = EventDispatcher()
  var onSelectionChange = EventDispatcher()
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

struct TextFieldView: ExpoSwiftUI.View, ExpoSwiftUI.FocusableView {
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

  func forceResignFirstResponder() {
    if textManager.isFocused {
      UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

    textManager.isFocused = false
    isFocused = false
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

  private var swiftUIAxis: Axis {
    props.axis == .vertical ? .vertical : .horizontal
  }

  var text: some View {
    let text = if #available(iOS 18.0, macOS 15.0, tvOS 18.0, *) {
#if !os(tvOS)
      TextField(
        props.placeholder,
        text: $textManager.text,
        selection: $textManager.selection,
        axis: swiftUIAxis
      )
#else
      TextField(
        props.placeholder,
        text: $textManager.text,
        axis: swiftUIAxis
      )
#endif
    } else if #available(iOS 16.0, tvOS 16.0, *) {
      TextField(
        props.placeholder,
        text: $textManager.text,
        axis: swiftUIAxis
      )
    } else {
      TextField(
        props.placeholder,
        text: $textManager.text
      )
    }
    return text
      .focused($isFocused)
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
        props.onValueChange(["value": newValue])
      }
      .onChange(of: textManager.isFocused) { newValue in
        isFocused = newValue
      }
      .onChange(of: isFocused) { newValue in
        textManager.isFocused = newValue
        props.onFocusChange(["value": newValue])
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
            props.onSelectionChange(["start": start, "end": end])
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
