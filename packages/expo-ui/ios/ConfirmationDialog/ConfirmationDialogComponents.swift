import SwiftUI
import ExpoModulesCore

internal struct ConfirmationDialogTrigger: ExpoSwiftUI.View {
  @ObservedObject var props: ConfirmationDialogTriggerProps

  var body: some View {
    Children()
  }
}

internal struct ConfirmationDialogActions: ExpoSwiftUI.View {
  @ObservedObject var props: ConfirmationDialogActionsProps

  var body: some View {
    Children()
  }
}

internal struct ConfirmationDialogMessage: ExpoSwiftUI.View {
  @ObservedObject var props: ConfirmationDialogMessageProps

  var body: some View {
    Children()
  }
}
