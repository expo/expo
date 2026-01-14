// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class TextViewProps: UIBaseViewProps {
  @Field var text: String = ""

  // Override default frame alignment for text views
  override var defaultFrameAlignment: Alignment { .leading }
}

public struct TextView: ExpoSwiftUI.View {
  @ObservedObject public var props: TextViewProps

  public init(props: TextViewProps) {
    self.props = props
  }

  public var body: some View {
    buildText(applyModifiers: false)
      .applyModifiers(props.modifiers, appContext: props.appContext, globalEventDispatcher: props.globalEventDispatcher)
  }

  internal func buildText(applyModifiers: Bool = true) -> Text {
    var result = applyModifiers
    ? Text(props.text).applyTextModifiers(props.modifiers, appContext: props.appContext)
    : Text(props.text)

    if let children = props.children {
      result = children
        .compactMap { ($0.childView as? TextView)?.buildText(applyModifiers: true) }
        .reduce(result, +)
    }
    return result
  }
}
