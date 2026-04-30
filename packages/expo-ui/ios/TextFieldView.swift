import SwiftUI
import ExpoModulesCore

enum TextFieldAxis: String, Enumerable {
  case horizontal
  case vertical
}

final class TextFieldProps: UIBaseViewProps {
  @Field var text: ObservableState = ObservableState(value: "")
  @Field var selection: ObservableState = ObservableState(value: ["start": 0, "end": 0])
  @Field var maxLength: Int?
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
    props.text.value = text
  }

  func clear() {
    props.text.value = ""
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
    let text = (props.text.value as? String) ?? ""
    let lower = max(0, min(min(start, end), text.count))
    let upper = max(0, min(max(start, end), text.count))
    props.selection.value = ["start": lower, "end": upper]
  }

  private var promptText: Text? {
    guard let slot = props.children?.slot("placeholder") else { return nil }
    return slot.props.children?
      .compactMap { ($0.childView as? TextView)?.buildText() }
      .first
  }

  var body: some View {
#if !os(tvOS)
    if #available(iOS 18.0, macOS 15.0, *) {
      StatefulSelectableTextField(
        state: props.text,
        selection: props.selection,
        props: props,
        textManager: textManager,
        isFocused: $isFocused,
        promptText: promptText
      )
    } else {
      StatefulTextField(
        state: props.text,
        props: props,
        textManager: textManager,
        isFocused: $isFocused,
        promptText: promptText
      )
    }
#else
    StatefulTextField(
      state: props.text,
      props: props,
      textManager: textManager,
      isFocused: $isFocused,
      promptText: promptText
    )
#endif
  }
}

private func extractInt(_ raw: Any?, _ key: String) -> Int? {
  guard let dict = raw as? NSDictionary, let value = dict[key] as? NSNumber else {
    return nil
  }
  return value.intValue
}

private struct StatefulTextField: View {
  @ObservedObject var state: ObservableState
  @ObservedObject var props: TextFieldProps
  @ObservedObject var textManager: TextFieldManager
  @FocusState.Binding var isFocused: Bool
  let promptText: Text?

  private var swiftUIAxis: Axis {
    props.axis == .vertical ? .vertical : .horizontal
  }

  @ViewBuilder
  var textField: some View {
    let textBinding = state.binding("")
    if #available(iOS 16.0, tvOS 16.0, *) {
      TextField(
        promptText == nil ? props.placeholder : "",
        text: textBinding,
        prompt: promptText,
        axis: swiftUIAxis
      )
      .focused($isFocused)
    } else {
      TextField(
        promptText == nil ? props.placeholder : "",
        text: textBinding,
        prompt: promptText
      )
      .focused($isFocused)
    }
  }

  var body: some View {
    textField
      .onAppear {
        if props.autoFocus {
          isFocused = true
        }
      }
      .onChange(of: state.value as? String) { newValue in
        if let max = props.maxLength, let str = newValue, str.count > max {
          state.value = String(str.prefix(max))
          return
        }
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
  }
}

#if !os(tvOS)
@available(iOS 18.0, macOS 15.0, *)
private struct StatefulSelectableTextField: View {
  @ObservedObject var state: ObservableState
  @ObservedObject var selection: ObservableState
  @ObservedObject var props: TextFieldProps
  @ObservedObject var textManager: TextFieldManager
  @FocusState.Binding var isFocused: Bool
  let promptText: Text?

  @State private var localSelection: SwiftUI.TextSelection?

  private var swiftUIAxis: Axis {
    props.axis == .vertical ? .vertical : .horizontal
  }

  var body: some View {
    let textBinding = state.binding("")
    TextField(
      promptText == nil ? props.placeholder : "",
      text: textBinding,
      selection: $localSelection,
      prompt: promptText,
      axis: swiftUIAxis
    )
    .focused($isFocused)
    .onAppear {
      if props.autoFocus {
        isFocused = true
      }
    }
    .onChange(of: state.value as? String) { newValue in
      if let max = props.maxLength, let str = newValue, str.count > max {
        state.value = String(str.prefix(max))
        return
      }
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
    .onChange(of: localSelection) { newSel in
      let text = (state.value as? String) ?? ""
      var start = text.count
      var end = text.count
      if let sel = newSel, case let .selection(range) = sel.indices {
        let clampedLower = range.lowerBound < text.endIndex ? range.lowerBound : text.endIndex
        let clampedUpper = range.upperBound < text.endIndex ? range.upperBound : text.endIndex
        start = text.distance(from: text.startIndex, to: clampedLower)
        end = text.distance(from: text.startIndex, to: clampedUpper)
      }
      let prevStart = extractInt(selection.value, "start")
      let prevEnd = extractInt(selection.value, "end")
      if prevStart == start && prevEnd == end { return }
      selection.value = ["start": start, "end": end]
      props.onSelectionChange(["start": start, "end": end])
    }
    .onChange(of: selection.value as? NSDictionary) { _ in
      guard let start = extractInt(selection.value, "start"),
            let end = extractInt(selection.value, "end") else { return }
      let text = (state.value as? String) ?? ""
      let lower = max(0, min(min(start, end), text.count))
      let upper = max(0, min(max(start, end), text.count))
      let startIdx = text.index(text.startIndex, offsetBy: lower)
      let endIdx = text.index(text.startIndex, offsetBy: upper)
      let newSel = SwiftUI.TextSelection(range: startIdx..<endIdx)
      if localSelection != newSel {
        localSelection = newSel
      }
    }
  }
}

#endif
