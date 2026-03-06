import SwiftUI
import ExpoModulesCore

public final class AccessoryWidgetBackgroundProps: UIBaseViewProps {}

public struct AccessoryWidgetBackgroundView: ExpoSwiftUI.View {
  @ObservedObject public var props: AccessoryWidgetBackgroundProps

  public init(props: AccessoryWidgetBackgroundProps) {
    self.props = props
  }

  public var body: some View {
    AccessoryWidgetBackground()
  }
}
