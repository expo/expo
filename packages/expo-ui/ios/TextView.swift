// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class TextViewProps: UIBaseViewProps {
  @Field public var text: String = ""
  @Field public var markdownEnabled: Bool = false

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
    let text = props.markdownEnabled ? Text(LocalizedStringKey(props.text)) : Text(props.text)
    var result = applyModifiers
    ? text.applyTextModifiers(props.modifiers, appContext: props.appContext)
    : text

    if let children = props.children {
      result = children
        .compactMap { ($0.childView as? TextView)?.buildText(applyModifiers: true) }
        .reduce(result, +)
    }
    return result
  }
}
