import ExpoModulesCore
import SwiftUI

internal final class ConfirmationDialogProps: UIBaseViewProps {
  @Field var title: String = ""
  @Field var isPresented: Bool = false
  @Field var titleVisibility: TitleVisibilityOption = .automatic
  var onIsPresentedChange = EventDispatcher()
}

internal final class ConfirmationDialogTriggerProps: ExpoSwiftUI.ViewProps {}

internal final class ConfirmationDialogActionsProps: ExpoSwiftUI.ViewProps {}

internal final class ConfirmationDialogMessageProps: ExpoSwiftUI.ViewProps {}

internal enum TitleVisibilityOption: String, Enumerable {
  case automatic
  case visible
  case hidden

  var visibility: Visibility {
    switch self {
    case .automatic:
      return .automatic
    case .visible:
      return .visible
    case .hidden:
      return .hidden
    }
  }
}
