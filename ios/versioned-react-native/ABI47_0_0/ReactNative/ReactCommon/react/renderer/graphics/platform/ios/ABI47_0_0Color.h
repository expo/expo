/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <optional>

#include <folly/Hash.h>
#include <ABI47_0_0React/ABI47_0_0renderer/graphics/ColorComponents.h>
#include <ABI47_0_0React/ABI47_0_0renderer/graphics/Float.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

using Color = int32_t;

class SharedColor {
 public:
  static const Color UndefinedColor = std::numeric_limits<Color>::max();

  SharedColor() : color_(UndefinedColor) {}

  SharedColor(const SharedColor &sharedColor) : color_(sharedColor.color_) {}

  SharedColor(Color color) : color_(color) {}

  SharedColor &operator=(const SharedColor &sharedColor) {
    color_ = sharedColor.color_;
    return *this;
  }

  Color operator*() const {
    return color_;
  }

  bool operator==(const SharedColor &otherColor) const {
    return color_ == otherColor.color_;
  }

  bool operator!=(const SharedColor &otherColor) const {
    return color_ != otherColor.color_;
  }

  operator bool() const {
    return color_ != UndefinedColor;
  }

 private:
  Color color_;
};

bool isColorMeaningful(SharedColor const &color) noexcept;
SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

SharedColor clearColor();
SharedColor blackColor();
SharedColor whiteColor();

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook

template <>
struct std::hash<ABI47_0_0facebook::ABI47_0_0React::SharedColor> {
  std::size_t operator()(ABI47_0_0facebook::ABI47_0_0React::SharedColor const &color) const {
    return hash<int>()(*color);
  }
};
