/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Color.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0RectangleCorners.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0RectangleEdges.h>

#include <array>
#include <bitset>
#include <cmath>
#include <optional>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

enum class PointerEventsMode : uint8_t { Auto, None, BoxNone, BoxOnly };

struct ViewEvents {
  std::bitset<32> bits{};

  enum class Offset : std::size_t {
    // Pointer events
    PointerEnter = 0,
    PointerMove = 1,
    PointerLeave = 2,

    // PanResponder callbacks
    MoveShouldSetResponder = 3,
    MoveShouldSetResponderCapture = 4,
    StartShouldSetResponder = 5,
    StartShouldSetResponderCapture = 6,
    ResponderGrant = 7,
    ResponderReject = 8,
    ResponderStart = 9,
    ResponderEnd = 10,
    ResponderRelease = 11,
    ResponderMove = 12,
    ResponderTerminate = 13,
    ResponderTerminationRequest = 14,
    ShouldBlockNativeResponder = 15,

    // Touch events
    TouchStart = 16,
    TouchMove = 17,
    TouchEnd = 18,
    TouchCancel = 19,

    // W3C Pointer Events
    PointerEnterCapture = 23,
    PointerLeaveCapture = 24,
    PointerMoveCapture = 25,
    PointerOver = 26,
    PointerOut = 27,
    PointerOverCapture = 28,
    PointerOutCapture = 29,

  };

  constexpr bool operator[](const Offset offset) const {
    return bits[static_cast<std::size_t>(offset)];
  }

  std::bitset<32>::reference operator[](const Offset offset) {
    return bits[static_cast<std::size_t>(offset)];
  }
};

inline static bool operator==(ViewEvents const &lhs, ViewEvents const &rhs) {
  return lhs.bits == rhs.bits;
}

inline static bool operator!=(ViewEvents const &lhs, ViewEvents const &rhs) {
  return lhs.bits != rhs.bits;
}

enum class BackfaceVisibility : uint8_t { Auto, Visible, Hidden };

enum class BorderCurve : uint8_t { Circular, Continuous };

enum class BorderStyle : uint8_t { Solid, Dotted, Dashed };

template <typename T>
struct CascadedRectangleEdges {
  using Counterpart = RectangleEdges<T>;
  using OptionalT = std::optional<T>;

  OptionalT left{};
  OptionalT top{};
  OptionalT right{};
  OptionalT bottom{};
  OptionalT start{};
  OptionalT end{};
  OptionalT horizontal{};
  OptionalT vertical{};
  OptionalT all{};
  OptionalT block{};
  OptionalT blockStart{};
  OptionalT blockEnd{};

  Counterpart resolve(bool isRTL, T defaults) const {
    const auto leadingEdge = isRTL ? end : start;
    const auto trailingEdge = isRTL ? start : end;
    const auto horizontalOrAllOrDefault =
        horizontal.value_or(all.value_or(defaults));
    const auto verticalOrAllOrDefault =
        vertical.value_or(all.value_or(defaults));

    return {
        /* .left = */
        left.value_or(leadingEdge.value_or(horizontalOrAllOrDefault)),
        /* .top = */
        blockStart.value_or(
            block.value_or(top.value_or(verticalOrAllOrDefault))),
        /* .right = */
        right.value_or(trailingEdge.value_or(horizontalOrAllOrDefault)),
        /* .bottom = */
        blockEnd.value_or(
            block.value_or(bottom.value_or(verticalOrAllOrDefault))),
    };
  }

  bool operator==(const CascadedRectangleEdges<T> &rhs) const {
    return std::tie(
               this->left,
               this->top,
               this->right,
               this->bottom,
               this->start,
               this->end,
               this->horizontal,
               this->vertical,
               this->all,
               this->block,
               this->blockStart,
               this->blockEnd) ==
        std::tie(
               rhs.left,
               rhs.top,
               rhs.right,
               rhs.bottom,
               rhs.start,
               rhs.end,
               rhs.horizontal,
               rhs.vertical,
               rhs.all,
               rhs.block,
               rhs.blockStart,
               rhs.blockEnd);
  }

  bool operator!=(const CascadedRectangleEdges<T> &rhs) const {
    return !(*this == rhs);
  }
};

template <typename T>
struct CascadedRectangleCorners {
  using Counterpart = RectangleCorners<T>;
  using OptionalT = std::optional<T>;

  OptionalT topLeft{};
  OptionalT topRight{};
  OptionalT bottomLeft{};
  OptionalT bottomRight{};
  OptionalT topStart{};
  OptionalT topEnd{};
  OptionalT bottomStart{};
  OptionalT bottomEnd{};
  OptionalT all{};
  OptionalT endEnd{};
  OptionalT endStart{};
  OptionalT startEnd{};
  OptionalT startStart{};

  Counterpart resolve(bool isRTL, T defaults) const {
    const auto logicalTopStart = topStart ? topStart : startStart;
    const auto logicalTopEnd = topEnd ? topEnd : startEnd;
    const auto logicalBottomStart = bottomStart ? bottomStart : endStart;
    const auto logicalBottomEnd = bottomEnd ? bottomEnd : endEnd;

    const auto topLeading = isRTL ? logicalTopEnd : logicalTopStart;
    const auto topTrailing = isRTL ? logicalTopStart : logicalTopEnd;
    const auto bottomLeading = isRTL ? logicalBottomEnd : logicalBottomStart;
    const auto bottomTrailing = isRTL ? logicalBottomStart : logicalBottomEnd;

    return {
        /* .topLeft = */ topLeft.value_or(
            topLeading.value_or(all.value_or(defaults))),
        /* .topRight = */
        topRight.value_or(topTrailing.value_or(all.value_or(defaults))),
        /* .bottomLeft = */
        bottomLeft.value_or(bottomLeading.value_or(all.value_or(defaults))),
        /* .bottomRight = */
        bottomRight.value_or(bottomTrailing.value_or(all.value_or(defaults))),
    };
  }

  bool operator==(const CascadedRectangleCorners<T> &rhs) const {
    return std::tie(
               this->topLeft,
               this->topRight,
               this->bottomLeft,
               this->bottomRight,
               this->topStart,
               this->topEnd,
               this->bottomStart,
               this->bottomEnd,
               this->all,
               this->endEnd,
               this->endStart,
               this->startEnd,
               this->startStart) ==
        std::tie(
               rhs.topLeft,
               rhs.topRight,
               rhs.bottomLeft,
               rhs.bottomRight,
               rhs.topStart,
               rhs.topEnd,
               rhs.bottomStart,
               rhs.bottomEnd,
               rhs.all,
               rhs.endEnd,
               rhs.endStart,
               rhs.startEnd,
               rhs.startStart);
  }

  bool operator!=(const CascadedRectangleCorners<T> &rhs) const {
    return !(*this == rhs);
  }
};

using BorderWidths = RectangleEdges<Float>;
using BorderCurves = RectangleCorners<BorderCurve>;
using BorderStyles = RectangleEdges<BorderStyle>;
using BorderColors = RectangleEdges<SharedColor>;
using BorderRadii = RectangleCorners<Float>;

using CascadedBorderWidths = CascadedRectangleEdges<Float>;
using CascadedBorderCurves = CascadedRectangleCorners<BorderCurve>;
using CascadedBorderStyles = CascadedRectangleEdges<BorderStyle>;
using CascadedBorderColors = CascadedRectangleEdges<SharedColor>;
using CascadedBorderRadii = CascadedRectangleCorners<Float>;

struct BorderMetrics {
  BorderColors borderColors{};
  BorderWidths borderWidths{};
  BorderRadii borderRadii{};
  BorderCurves borderCurves{};
  BorderStyles borderStyles{};

  bool operator==(const BorderMetrics &rhs) const {
    return std::tie(
               this->borderColors,
               this->borderWidths,
               this->borderRadii,
               this->borderCurves,
               this->borderStyles) ==
        std::tie(
               rhs.borderColors,
               rhs.borderWidths,
               rhs.borderRadii,
               rhs.borderCurves,
               rhs.borderStyles);
  }

  bool operator!=(const BorderMetrics &rhs) const {
    return !(*this == rhs);
  }
};

#ifdef ANDROID

struct NativeDrawable {
  enum class Kind : uint8_t {
    Ripple,
    ThemeAttr,
  };

  struct Ripple {
    std::optional<int32_t> color{};
    std::optional<Float> rippleRadius{};
    bool borderless{false};

    bool operator==(const Ripple &rhs) const {
      return std::tie(this->color, this->borderless, this->rippleRadius) ==
          std::tie(rhs.color, rhs.borderless, rhs.rippleRadius);
    }
  };

  std::string themeAttr;
  Ripple ripple;
  Kind kind;

  bool operator==(const NativeDrawable &rhs) const {
    if (this->kind != rhs.kind)
      return false;
    switch (this->kind) {
      case Kind::ThemeAttr:
        return this->themeAttr == rhs.themeAttr;
      case Kind::Ripple:
        return this->ripple == rhs.ripple;
    }
  }

  bool operator!=(const NativeDrawable &rhs) const {
    return !(*this == rhs);
  }

  ~NativeDrawable() = default;
};

#endif

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
