import SwiftUI
import ExpoModulesCore

final class SecureFieldProps: UIBaseViewProps {
  @Field var text: ObservableState = ObservableState(value: "")
  @Field var maxLength: Int?
  @Field var autoFocus: Bool = false
  @Field var placeholder: String = ""
  @Field var onTextChangeSync: WorkletCallback?
  var onTextChange = EventDispatcher()
  var onFocusChange = EventDispatcher()
}

struct SecureFieldView: ExpoSwiftUI.View, ExpoSwiftUI.FocusableView {
  @ObservedObject var props: SecureFieldProps
  @ObservedObject var textManager: TextFieldManager = TextFieldManager()
  @FocusState private var isFocused: Bool

  init(props: SecureFieldProps) {
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

  private var promptText: Text? {
    guard let slot = props.children?.slot("placeholder") else { return nil }
    return slot.props.children?
      .compactMap { ($0.childView as? TextView)?.buildText() }
      .first
  }

  var body: some View {
    StatefulSecureField(
      state: props.text,
      props: props,
      textManager: textManager,
      isFocused: $isFocused,
      promptText: promptText
    )
  }
}

private struct StatefulSecureField: View {
  @ObservedObject var state: ObservableState
  @ObservedObject var props: SecureFieldProps
  @ObservedObject var textManager: TextFieldManager
  @FocusState.Binding var isFocused: Bool
  let promptText: Text?

  var body: some View {
    let textBinding = state.binding("")
    SecureField(
      promptText == nil ? props.placeholder : "",
      text: textBinding,
      prompt: promptText
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
  }
}
