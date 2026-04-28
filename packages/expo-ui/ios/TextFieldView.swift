import SwiftUI
import ExpoModulesCore

enum TextFieldAxis: String, Enumerable {
  case horizontal
  case vertical
}

final class TextFieldProps: UIBaseViewProps {
  @Field var text: ObservableState?
  @Field var autoFocus: Bool = false
  @Field var placeholder: String = ""
  @Field var axis: TextFieldAxis = .horizontal
  @Field var onTextChangeSync: WorkletCallback?
  var onTextChange = EventDispatcher()
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
    props.text?.value = text
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
      let currentText = (props.text?.value as? String) ?? ""
      let lowerBound = min(start, end)
      let upperBound = max(start, end)
      let startIndex = currentText.index(currentText.startIndex, offsetBy: min(lowerBound, currentText.count))
      let endIndex = currentText.index(currentText.startIndex, offsetBy: min(upperBound, currentText.count))
      textManager.selection = SwiftUI.TextSelection(range: startIndex..<endIndex)
    }
#endif
  }

  var body: some View {
    if let state = props.text {
      StatefulTextField(
        state: state,
        props: props,
        textManager: textManager,
        isFocused: $isFocused
      )
    }
  }
}

private struct StatefulTextField: View {
  @ObservedObject var state: ObservableState
  @ObservedObject var props: TextFieldProps
  @ObservedObject var textManager: TextFieldManager
  @FocusState.Binding var isFocused: Bool

  private var swiftUIAxis: Axis {
    props.axis == .vertical ? .vertical : .horizontal
  }

  @ViewBuilder
  var textField: some View {
    let textBinding = state.binding("")
    if #available(iOS 18.0, macOS 15.0, tvOS 18.0, *) {
#if !os(tvOS)
      TextField(
        props.placeholder,
        text: textBinding,
        selection: $textManager.selection,
        axis: swiftUIAxis
      )
      .focused($isFocused)
#else
      TextField(
        props.placeholder,
        text: textBinding,
        axis: swiftUIAxis
      )
      .focused($isFocused)
#endif
    } else if #available(iOS 16.0, tvOS 16.0, *) {
      TextField(
        props.placeholder,
        text: textBinding,
        axis: swiftUIAxis
      )
      .focused($isFocused)
    } else {
      TextField(
        props.placeholder,
        text: textBinding
      )
      .focused($isFocused)
    }
  }

  var body: some View {
    let baseView = textField
      .onAppear {
        if props.autoFocus {
          isFocused = true
        }
      }
      .onChange(of: state.value as? String) { newValue in
        props.onTextChange(["value": newValue])
        props.onTextChangeSync?.invoke(arguments: [newValue])
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
            let currentText = (state.value as? String) ?? ""
            let clampedLower = range.lowerBound < currentText.endIndex ? range.lowerBound : currentText.endIndex
            let clampedUpper = range.upperBound < currentText.endIndex ? range.upperBound : currentText.endIndex

            let start = currentText.distance(from: currentText.startIndex, to: clampedLower)
            let end = currentText.distance(from: currentText.startIndex, to: clampedUpper)
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
