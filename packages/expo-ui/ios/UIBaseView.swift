// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 Base view for all SwiftUI views in expo-ui.
 */
public struct UIBaseView<Props: UIBaseViewProps, Content: ExpoSwiftUI.View<Props>>: ExpoSwiftUI.View {
  @ObservedObject public var props: Props

  public init(props: Props) {
    self.props = props
  }

  public var body: some View {
    Content(props: props)
      .applyFixedSize(props.fixedSize)
      .applyFrame(props.frame, defaultAlignment: props.defaultFrameAlignment)
      .applyPadding(props.padding)
      .applyAccessibilityIdentifier(props.testID)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
  }
}

/**
 Base view modifier in expo-ui
 This is useful for View with AsyncFunctions that cannot use the `ExpoUIView` builder.
 */
public struct UIBaseViewModifier<Props: UIBaseViewProps>: ViewModifier {
  @ObservedObject var props: Props
  var defaultFrameAlignment = Alignment.center

  public func body(content: Content) -> some View {
    content
      .applyFixedSize(props.fixedSize)
      .applyFrame(props.frame, defaultAlignment: props.defaultFrameAlignment)
      .applyPadding(props.padding)
      .applyAccessibilityIdentifier(props.testID)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
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
