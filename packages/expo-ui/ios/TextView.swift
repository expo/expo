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
    buildText()
  }

  internal func buildText() -> Text {
    var result = Text(props.text)
      .applyTextModifiers(props.modifiers, appContext: props.appContext, eventDispatcher: props.globalEventDispatcher)

    if let children = props.children {
      for child in children {
        if let textView = child.childView as? TextView {
          result = result + textView.buildText()
        }
      }
    }
    return result
  }
}
