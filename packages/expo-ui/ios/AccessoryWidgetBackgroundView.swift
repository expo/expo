import SwiftUI
import ExpoModulesCore
#if !os(tvOS)
import WidgetKit
#endif

public final class AccessoryWidgetBackgroundProps: UIBaseViewProps {}

public struct AccessoryWidgetBackgroundView: ExpoSwiftUI.View {
  @ObservedObject public var props: AccessoryWidgetBackgroundProps

  public init(props: AccessoryWidgetBackgroundProps) {
    self.props = props
  }

  public var body: some View {
#if !os(tvOS)
    if #available(iOS 16.0, *) {
      AccessoryWidgetBackground()
    } else {
      Color.clear
    }
#else
    EmptyView()
#endif
  }
}
