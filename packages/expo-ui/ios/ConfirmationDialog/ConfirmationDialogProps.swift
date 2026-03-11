import ExpoModulesCore
import SwiftUI

internal final class ConfirmationDialogProps: UIBaseViewProps {
  @Field var title: String = ""
  @Field var isPresented: Bool = false
  @Field var titleVisibility: VisibilityOptions = .automatic
  var onIsPresentedChange = EventDispatcher()
}

