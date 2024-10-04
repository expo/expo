/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Hash.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/LayoutPrimitives.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/DebugStringConvertible.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/flags.h>
#include <ABI47_0_0React/ABI47_0_0renderer/graphics/Geometry.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

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
  EdgeInsets overflowInset{};

  Rect getContentFrame() const {
    return Rect{
        Point{contentInsets.left, contentInsets.top},
        Size{
            frame.size.width - contentInsets.left - contentInsets.right,
            frame.size.height - contentInsets.top - contentInsets.bottom}};
  }

  bool operator==(const LayoutMetrics &rhs) const {
    return std::tie(
               this->frame,
               this->contentInsets,
               this->borderWidth,
               this->displayType,
               this->layoutDirection,
               this->pointScaleFactor,
               this->overflowInset) ==
        std::tie(
               rhs.frame,
               rhs.contentInsets,
               rhs.borderWidth,
               rhs.displayType,
               rhs.layoutDirection,
               rhs.pointScaleFactor,
               rhs.overflowInset);
  }

  bool operator!=(const LayoutMetrics &rhs) const {
    return !(*this == rhs);
  }
};

/*
 * Represents some undefined, not-yet-computed or meaningless value of
 * `LayoutMetrics` type.
 * The value is comparable by equality with any other `LayoutMetrics` value.
 */
static LayoutMetrics const EmptyLayoutMetrics = {
    /* .frame = */ {{0, 0}, {-1.0, -1.0}}};

#ifdef ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(LayoutMetrics const &object);
std::vector<DebugStringConvertibleObject> getDebugProps(
    LayoutMetrics const &object,
    DebugStringConvertibleOptions options);

#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook

namespace std {

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics &layoutMetrics) const {
    return folly::hash::hash_combine(
        0,
        layoutMetrics.frame,
        layoutMetrics.contentInsets,
        layoutMetrics.borderWidth,
        layoutMetrics.displayType,
        layoutMetrics.layoutDirection,
        layoutMetrics.pointScaleFactor,
        layoutMetrics.overflowInset);
  }
};

} // namespace std
