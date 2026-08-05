import ExpoModulesCore
import SwiftUI

internal final class AlertProps: UIBaseViewProps {
  @Field var title: String = ""
  @Field var isPresented: Bool = false
  var onIsPresentedChange = EventDispatcher()
}
