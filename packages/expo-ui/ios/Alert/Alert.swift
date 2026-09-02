import SwiftUI
import ExpoModulesCore

internal struct AlertView: ExpoSwiftUI.View {
  @ObservedObject var props: AlertProps
  @State private var isPresented: Bool = false

  var body: some View {
    triggerContent
      .alert(
        props.title,
        isPresented: $isPresented
      ) {
        actionsContent
      } message: {
        messageContent
      }
      .onAppear {
        isPresented = props.isPresented
      }
      .onChange(of: isPresented) { newValue in
        if props.isPresented != newValue {
          props.onIsPresentedChange(["isPresented": newValue])
        }
      }
      .onChange(of: props.isPresented) { newValue in
        isPresented = newValue
      }
  }

  @ViewBuilder
  private var triggerContent: some View {
    if let trigger = props.children?.slot("trigger") {
      trigger
    } else {
      EmptyView()
        .onAppear {
          log.warn("Alert requires an Alert.Trigger child to be visible")
        }
    }
  }

  @ViewBuilder
  private var actionsContent: some View {
    if let actions = props.children?.slot("actions") {
      actions
    }
  }

  @ViewBuilder
  private var messageContent: some View {
    if let message = props.children?.slot("message") {
      message
    }
  }
}
