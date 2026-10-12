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
    innerView
      .applyAccessibilityIdentifier(props.testID)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
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
  let contentName = String(describing: contentType)

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
  let contentName = String(describing: contentType)

  return ExpoSwiftUI.ViewDefinition(wrappedType, name: contentName, elements: elements())
}
