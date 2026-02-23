import ExpoModulesCore
import SwiftUI

internal final class ConfirmationDialogProps: UIBaseViewProps {
  @Field var title: String = ""
  @Field var isPresented: Bool = false
  @Field var titleVisibility: VisibilityOptions = .automatic
  var onIsPresentedChange = EventDispatcher()
}

internal final class ConfirmationDialogTriggerProps: ExpoSwiftUI.ViewProps {}

internal final class ConfirmationDialogActionsProps: ExpoSwiftUI.ViewProps {}

internal final class ConfirmationDialogMessageProps: ExpoSwiftUI.ViewProps {}
