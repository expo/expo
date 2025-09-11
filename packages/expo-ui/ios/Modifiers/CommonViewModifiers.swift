// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal protocol CommonViewModifierProps: ObservableObject {
  var fixedSize: Bool? { get }
  var frame: FrameOptions? { get }
  var padding: PaddingOptions? { get }
  var testID: String? { get }
  var modifiers: ModifierArray? { get }

  var appContext: AppContext? { get }
  var globalEventDispatcher: EventDispatcher { get }
}

internal struct CommonViewModifiers<Props: CommonViewModifierProps>: ViewModifier {
  @ObservedObject var props: Props
  var defaultFrameAlignment = Alignment.center

  func body(content: Content) -> some View {
    content
      .applyFixedSize(props.fixedSize)
      .applyFrame(props.frame, defaultAlignment: defaultFrameAlignment)
      .applyPadding(props.padding)
      .applyAccessibilityIdentifier(props.testID)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
  }
}
