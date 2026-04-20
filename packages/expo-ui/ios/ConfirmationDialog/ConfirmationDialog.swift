import SwiftUI
import ExpoModulesCore

internal struct ConfirmationDialogView: ExpoSwiftUI.View {
  @ObservedObject var props: ConfirmationDialogProps
  @State private var isPresented: Bool = false

  var body: some View {
    triggerContent
      .confirmationDialog(
        props.title,
        isPresented: $isPresented,
        titleVisibility: props.titleVisibility.toVisibility()
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
          log.warn("ConfirmationDialog requires a ConfirmationDialog.Trigger child to be visible")
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
