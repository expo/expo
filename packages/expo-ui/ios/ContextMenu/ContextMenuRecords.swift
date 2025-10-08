import ExpoModulesCore

internal enum ActivationMethod: String, Enumerable {
  case singlePress
  case longPress
}

internal final class ContextMenuProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var activationMethod: ActivationMethod? = .singlePress
}

internal final class ContextMenuPreviewProps: ExpoSwiftUI.ViewProps {}

internal final class ContextMenuActivationElementProps: ExpoSwiftUI.ViewProps {}

internal final class ContextMenuContentProps: ExpoSwiftUI.ViewProps {}
