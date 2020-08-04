/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/core/LayoutPrimitives.h>
#include <ABI37_0_0React/graphics/Geometry.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

/*
 * Describes results of layout process for particular shadow node.
 */
struct LayoutMetrics {
  Rect frame;
  EdgeInsets contentInsets{0};
  EdgeInsets borderWidth{0};
  DisplayType displayType{DisplayType::Flex};
  LayoutDirection layoutDirection{LayoutDirection::Undefined};
  Float pointScaleFactor{1.0};

  Rect getContentFrame() const {
    return Rect{
        Point{contentInsets.left, contentInsets.top},
        Size{frame.size.width - contentInsets.left - contentInsets.right,
             frame.size.height - contentInsets.top - contentInsets.bottom}};
  }

  bool operator==(const LayoutMetrics &rhs) const {
    return std::tie(
               this->frame,
               this->contentInsets,
               this->borderWidth,
               this->displayType,
               this->layoutDirection,
               this->pointScaleFactor) ==
        std::tie(
               rhs.frame,
               rhs.contentInsets,
               rhs.borderWidth,
               rhs.displayType,
               rhs.layoutDirection,
               rhs.pointScaleFactor);
  }

  bool operator!=(const LayoutMetrics &rhs) const {
    return !(*this == rhs);
  }
};

/*
 * Represents some undefined, not-yet-computed or meaningless value of
 * `LayoutMetrics` type.
 */
static const LayoutMetrics EmptyLayoutMetrics = {/* .frame = */ {
    /* .origin = */ {0, 0},
    /* .size = */ {-1, -1},
}};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
