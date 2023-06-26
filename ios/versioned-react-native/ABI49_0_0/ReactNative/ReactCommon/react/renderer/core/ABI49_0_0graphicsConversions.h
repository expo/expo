/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0butter/ABI49_0_0map.h>
#include <glog/logging.h>
#include <ABI49_0_0React/debug/ABI49_0_0React_native_expect.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0RawProps.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Color.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0PlatformColorParser.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Point.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Rect.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0RectangleCorners.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0RectangleEdges.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Size.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

#pragma mark - Color

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    SharedColor &result) {
  ColorComponents colorComponents = {0, 0, 0, 0};

  if (value.hasType<int>()) {
    auto argb = (int64_t)value;
    auto ratio = 255.f;
    colorComponents.alpha = ((argb >> 24) & 0xFF) / ratio;
    colorComponents.red = ((argb >> 16) & 0xFF) / ratio;
    colorComponents.green = ((argb >> 8) & 0xFF) / ratio;
    colorComponents.blue = (argb & 0xFF) / ratio;
  } else if (value.hasType<std::vector<float>>()) {
    auto items = (std::vector<float>)value;
    auto length = items.size();
    ABI49_0_0React_native_expect(length == 3 || length == 4);
    colorComponents.red = items.at(0);
    colorComponents.green = items.at(1);
    colorComponents.blue = items.at(2);
    colorComponents.alpha = length == 4 ? items.at(3) : 1.0f;
  } else {
    colorComponents = parsePlatformColor(context, value);
  }

  result = colorFromComponents(colorComponents);
}

#ifdef ANDROID
inline int toAndroidRepr(const SharedColor &color) {
  return *color;
}
inline folly::dynamic toDynamic(const SharedColor &color) {
  return *color;
}
#endif

inline std::string toString(const SharedColor &value) {
  ColorComponents components = colorComponentsFromColor(value);
  auto ratio = 255.f;
  return "rgba(" + folly::to<std::string>(round(components.red * ratio)) +
      ", " + folly::to<std::string>(round(components.green * ratio)) + ", " +
      folly::to<std::string>(round(components.blue * ratio)) + ", " +
      folly::to<std::string>(round(components.alpha * ratio)) + ")";
}

#pragma mark - Geometry

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    Point &result) {
  if (value.hasType<butter::map<std::string, Float>>()) {
    auto map = (butter::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "x") {
        result.x = pair.second;
      } else if (pair.first == "y") {
        result.y = pair.second;
      }
    }
    return;
  }

  ABI49_0_0React_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    ABI49_0_0React_native_expect(array.size() == 2);
    if (array.size() >= 2) {
      result = {array.at(0), array.at(1)};
    } else {
      result = {0, 0};
      LOG(ERROR) << "Unsupported Point vector size: " << array.size();
    }
  } else {
    LOG(ERROR) << "Unsupported Point type";
  }
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    Size &result) {
  if (value.hasType<butter::map<std::string, Float>>()) {
    auto map = (butter::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "width") {
        result.width = pair.second;
      } else if (pair.first == "height") {
        result.height = pair.second;
      } else {
        LOG(ERROR) << "Unsupported Size map key: " << pair.first;
        ABI49_0_0React_native_expect(false);
      }
    }
    return;
  }

  ABI49_0_0React_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    ABI49_0_0React_native_expect(array.size() == 2);
    if (array.size() >= 2) {
      result = {array.at(0), array.at(1)};
    } else {
      result = {0, 0};
      LOG(ERROR) << "Unsupported Size vector size: " << array.size();
    }
  } else {
    LOG(ERROR) << "Unsupported Size type";
  }
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    EdgeInsets &result) {
  if (value.hasType<Float>()) {
    auto number = (Float)value;
    result = {number, number, number, number};
    return;
  }

  if (value.hasType<butter::map<std::string, Float>>()) {
    auto map = (butter::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "top") {
        result.top = pair.second;
      } else if (pair.first == "left") {
        result.left = pair.second;
      } else if (pair.first == "bottom") {
        result.bottom = pair.second;
      } else if (pair.first == "right") {
        result.right = pair.second;
      } else {
        LOG(ERROR) << "Unsupported EdgeInsets map key: " << pair.first;
        ABI49_0_0React_native_expect(false);
      }
    }
    return;
  }

  ABI49_0_0React_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    ABI49_0_0React_native_expect(array.size() == 4);
    if (array.size() >= 4) {
      result = {array.at(0), array.at(1), array.at(2), array.at(3)};
    } else {
      result = {0, 0, 0, 0};
      LOG(ERROR) << "Unsupported EdgeInsets vector size: " << array.size();
    }
  } else {
    LOG(ERROR) << "Unsupported EdgeInsets type";
  }
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    CornerInsets &result) {
  if (value.hasType<Float>()) {
    auto number = (Float)value;
    result = {number, number, number, number};
    return;
  }

  if (value.hasType<butter::map<std::string, Float>>()) {
    auto map = (butter::map<std::string, Float>)value;
    for (const auto &pair : map) {
      if (pair.first == "topLeft") {
        result.topLeft = pair.second;
      } else if (pair.first == "topRight") {
        result.topRight = pair.second;
      } else if (pair.first == "bottomLeft") {
        result.bottomLeft = pair.second;
      } else if (pair.first == "bottomRight") {
        result.bottomRight = pair.second;
      } else {
        LOG(ERROR) << "Unsupported CornerInsets map key: " << pair.first;
        ABI49_0_0React_native_expect(false);
      }
    }
    return;
  }

  ABI49_0_0React_native_expect(value.hasType<std::vector<Float>>());
  if (value.hasType<std::vector<Float>>()) {
    auto array = (std::vector<Float>)value;
    ABI49_0_0React_native_expect(array.size() == 4);
    if (array.size() >= 4) {
      result = {array.at(0), array.at(1), array.at(2), array.at(3)};
    } else {
      LOG(ERROR) << "Unsupported CornerInsets vector size: " << array.size();
    }
  }

  // Error case - we should only here if all other supported cases fail
  // In dev we would crash on assert before this point
  result = {0, 0, 0, 0};
  LOG(ERROR) << "Unsupported CornerInsets type";
}

inline std::string toString(const Point &point) {
  return "{" + folly::to<std::string>(point.x) + ", " +
      folly::to<std::string>(point.y) + "}";
}

inline std::string toString(const Size &size) {
  return "{" + folly::to<std::string>(size.width) + ", " +
      folly::to<std::string>(size.height) + "}";
}

inline std::string toString(const Rect &rect) {
  return "{" + toString(rect.origin) + ", " + toString(rect.size) + "}";
}

inline std::string toString(const EdgeInsets &edgeInsets) {
  return "{" + folly::to<std::string>(edgeInsets.left) + ", " +
      folly::to<std::string>(edgeInsets.top) + ", " +
      folly::to<std::string>(edgeInsets.right) + ", " +
      folly::to<std::string>(edgeInsets.bottom) + "}";
}

inline std::string toString(const CornerInsets &cornerInsets) {
  return "{" + folly::to<std::string>(cornerInsets.topLeft) + ", " +
      folly::to<std::string>(cornerInsets.topRight) + ", " +
      folly::to<std::string>(cornerInsets.bottomLeft) + ", " +
      folly::to<std::string>(cornerInsets.bottomRight) + "}";
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
