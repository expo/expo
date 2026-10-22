// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 Base view for all SwiftUI views in expo-ui.
 */
public struct UIBaseView<Props: UIBaseViewProps, Content: ExpoSwiftUI.View<Props>>: ExpoSwiftUI.View {
  @ObservedObject public var props: Props
  let innerView: Content

  public init(props: Props) {
    self.props = props
    self.innerView = Content(props: props)
  }

  public var body: some View {
    UniversalPercentageParentBoundary(content: innerView)
      .applyAccessibilityIdentifier(props.testID)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
      // A user modifier such as `onGeometryChange` hides the layout value a universal stack reads.
      // Set it again outside every modifier.
      .layoutValue(key: UniversalLayoutDimensionsKey.self, value: universalLayoutDimensions(from: props.modifiers))
      .publishZeroContentOrigin(props.shadowNodeProxy)
  }
}

extension View {
  /**
   SwiftUI places this view, so `measure()` must skip its Yoga origin. A zero content origin does that,
   and `RNHostView` reports its own position inside the `Host`. Core clears the entry on teardown.
   */
  func publishZeroContentOrigin(_ shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy) -> some View {
    onAppear {
      shadowNodeProxy.setContentOrigin?(.zero)
    }
  }
}

/**
 Deprecated. Use `applyModifiers` method directly instead.
 */
@available(*, deprecated, message: "Use applyModifiers method directly on the content view instead.")
public struct UIBaseViewModifier<Props: UIBaseViewProps>: ViewModifier {
  @ObservedObject var props: Props
  var defaultFrameAlignment = Alignment.center

  public func body(content: Content) -> some View {
    content
      .applyAccessibilityIdentifier(props.testID)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
  }
}

// MARK: - ViewWrapper

extension UIBaseView: ExpoSwiftUI.ViewWrapper {
  public func getWrappedView() -> Any {
    return innerView
  }
}

// MARK: - FocusableView forwarding
extension UIBaseView: ExpoSwiftUI.FocusableView where Content: ExpoSwiftUI.FocusableView {
  public func forceResignFirstResponder() {
    innerView.forceResignFirstResponder()
  }
}

/**
 Common UI Builder in expo-ui.
 This is similar to expo-modules-core's View builder but further supports common base view props and modifiers
 */
public func ExpoUIView<Content: ExpoSwiftUI.View>(
  _ contentType: Content.Type
) -> ExpoSwiftUI.ViewDefinition<Content.Props, UIBaseView<Content.Props, Content>> where Content.Props: UIBaseViewProps {
  let wrappedType = UIBaseView<Content.Props, Content>.self
  let contentName = unqualifiedTypeName(contentType)

  return View(wrappedType) {
    ViewName(contentName)
  }
}

/**
 ExpoUIView overload that accepts a `@ViewDefinitionBuilder` closure for registering
 AsyncFunctions and other view definition elements.
 */
public func ExpoUIView<Content: ExpoSwiftUI.View>(
  _ contentType: Content.Type,
  @ExpoSwiftUI.ViewDefinitionBuilder<Content> _ elements: @escaping () -> [AnyViewDefinitionElement]
) -> ExpoSwiftUI.ViewDefinition<Content.Props, UIBaseView<Content.Props, Content>> where Content.Props: UIBaseViewProps {
  let wrappedType = UIBaseView<Content.Props, Content>.self
  let contentName = unqualifiedTypeName(contentType)

  return ExpoSwiftUI.ViewDefinition(wrappedType, name: contentName, elements: elements())
}

/**
 The name `String(describing: type)` gives for a metatype, without its three protocol conformance probes and the `Mirror`.
 It takes an opaque `Any.Type` and is never inlined on purpose.
 With a statically known metatype the optimizer folds `_typeName` into a constant that keeps the file discriminator
 of a `private` type, e.g. `(Foo in _ABC123…)`, where `String(describing:)` yields `Foo`.
 */
@inline(never)
private func unqualifiedTypeName(_ type: Any.Type) -> String {
  return _typeName(type, qualified: false)
}
