/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef ANDROID

#include "ABI48_0_0ViewProps.h"
#include "ABI48_0_0ViewPropsMapBuffer.h"

#include "ABI48_0_0viewPropConversions.h"

#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBufferBuilder.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

MapBuffer convertBorderWidths(ABI48_0_0YGStyle::Edges const &border) {
  MapBufferBuilder builder(7);
  putOptionalFloat(
      builder, EDGE_TOP, optionalFloatFromYogaValue(border[ABI48_0_0YGEdgeTop]));
  putOptionalFloat(
      builder, EDGE_RIGHT, optionalFloatFromYogaValue(border[ABI48_0_0YGEdgeRight]));
  putOptionalFloat(
      builder, EDGE_BOTTOM, optionalFloatFromYogaValue(border[ABI48_0_0YGEdgeBottom]));
  putOptionalFloat(
      builder, EDGE_LEFT, optionalFloatFromYogaValue(border[ABI48_0_0YGEdgeLeft]));
  putOptionalFloat(
      builder, EDGE_START, optionalFloatFromYogaValue(border[ABI48_0_0YGEdgeStart]));
  putOptionalFloat(
      builder, EDGE_END, optionalFloatFromYogaValue(border[ABI48_0_0YGEdgeEnd]));
  putOptionalFloat(
      builder, EDGE_ALL, optionalFloatFromYogaValue(border[ABI48_0_0YGEdgeAll]));
  return builder.build();
}

// TODO: Currently unsupported: nextFocusForward/Left/Up/Right/Down
void YogaStylableProps::propsDiffMapBuffer(
    Props const *oldPropsPtr,
    MapBufferBuilder &builder) const {
  // Call with default props if necessary
  if (oldPropsPtr == nullptr) {
    YogaStylableProps defaultProps{};
    propsDiffMapBuffer(&defaultProps, builder);
    return;
  }

  // Delegate to base classes
  Props::propsDiffMapBuffer(oldPropsPtr, builder);

  YogaStylableProps const &oldProps =
      *(static_cast<const YogaStylableProps *>(oldPropsPtr));
  YogaStylableProps const &newProps = *this;

  if (oldProps.yogaStyle != newProps.yogaStyle) {
    auto const &oldStyle = oldProps.yogaStyle;
    auto const &newStyle = newProps.yogaStyle;

    if (!(oldStyle.border() == newStyle.border())) {
      builder.putMapBuffer(
          ABI48_0_0YG_BORDER_WIDTH, convertBorderWidths(newStyle.border()));
    }

    if (oldStyle.overflow() != newStyle.overflow()) {
      int value;
      switch (newStyle.overflow()) {
        case ABI48_0_0YGOverflowVisible:
          value = 0;
          break;
        case ABI48_0_0YGOverflowHidden:
          value = 1;
          break;
        case ABI48_0_0YGOverflowScroll:
          value = 2;
          break;
      }
      builder.putInt(ABI48_0_0YG_OVERFLOW, value);
    }
  }
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

#endif
