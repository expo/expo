import ExpoModulesCore

internal enum ActivationMethod: String, Enumerable {
  case singlePress
  case longPress
}

internal final class ContextMenuProps: UIBaseViewProps {
  @Field var activationMethod: ActivationMethod? = .singlePress
}

internal final class ContextMenuPreviewProps: ExpoSwiftUI.ViewProps {}

internal final class ContextMenuActivationElementProps: ExpoSwiftUI.ViewProps {}

internal final class ContextMenuContentProps: ExpoSwiftUI.ViewProps {}
