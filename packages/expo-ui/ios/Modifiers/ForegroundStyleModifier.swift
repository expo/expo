// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ForegroundStyleModifier: ViewModifier, Record {
  @Field var style: ShapeStyleValue?

  func body(content: Content) -> some View {
    if let shapeStyle = style?.toAnyShapeStyle() {
      content.foregroundStyle(shapeStyle)
    } else {
      content
    }
  }
}

/**
 `Text` keeps its own type through `foregroundStyle(_:)`, which lets the caller apply further
 text-only modifiers, so the text overload is applied separately from the view one.

 TODO: `Text.foregroundStyle(_:)` requires iOS 17. Once the package drops iOS 16, inline this
 into the `foregroundStyle` case of `applyTextModifier` and delete the color-only fallback there.
 */
@available(iOS 17.0, tvOS 17.0, *)
internal func applyForegroundStyle(_ modifier: ForegroundStyleModifier, to text: Text) -> Text {
  guard let shapeStyle = modifier.style?.toAnyShapeStyle() else {
    return text
  }
  return text.foregroundStyle(shapeStyle)
}
