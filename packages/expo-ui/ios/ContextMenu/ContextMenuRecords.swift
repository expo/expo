import ExpoModulesCore

internal enum ActivationMethod: String, Enumerable {
  case singlePress
  case longPress
}

internal final class Submenu: Record, Identifiable {
  required init() { }
  @Field var elements: [ContextMenuElement]
  @Field var button: ButtonProps
}

internal final class ContextMenuElement: Record, Identifiable {
  required init() { }
  @Field var button: ButtonProps?
  @Field var picker: PickerProps?
  @Field var `switch`: SwitchProps?
  @Field var submenu: Submenu?
  @Field var contextMenuElementID: String?
}

internal final class ContextMenuProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var elements: [ContextMenuElement]
  var onContextMenuButtonPressed = EventDispatcher()
  var onContextMenuPickerOptionSelected = EventDispatcher()
  var onContextMenuSwitchCheckedChanged = EventDispatcher()
  @Field var activationMethod: ActivationMethod? = .singlePress
}

internal final class ContextMenuPreviewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?
}

internal final class ContextMenuActivationElementProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?
}
