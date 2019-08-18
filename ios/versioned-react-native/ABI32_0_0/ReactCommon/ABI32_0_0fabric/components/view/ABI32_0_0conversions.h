/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI32_0_0fabric/ABI32_0_0components/view/primitives.h>
#include <ABI32_0_0fabric/ABI32_0_0core/LayoutMetrics.h>
#include <ABI32_0_0fabric/ABI32_0_0graphics/Geometry.h>
#include <folly/dynamic.h>
#include <folly/Conv.h>
#include <ABI32_0_0yoga/ABI32_0_0Yoga.h>
#include <ABI32_0_0yoga/ABI32_0_0YGNode.h>

namespace facebook {
namespace ReactABI32_0_0 {

inline Float fabricFloatFromYogaFloat(float value) {
  if (value == ABI32_0_0YGUndefined) {
    return kFloatUndefined;
  }

  return (Float)value;
}

inline float yogaFloatFromFabricFloat(Float value) {
  if (value == kFloatUndefined) {
    return ABI32_0_0YGUndefined;
  }

  return (float)value;
}

inline Float fabricFloatFromYogaOptionalFloat(ABI32_0_0YGFloatOptional value) {
  if (value.isUndefined()) {
    return kFloatUndefined;
  }

  return fabricFloatFromYogaFloat(value.getValue());
}

inline ABI32_0_0YGFloatOptional yogaOptionalFloatFromFabricFloat(Float value) {
  if (value == kFloatUndefined) {
    return ABI32_0_0YGFloatOptional();
  }

  return ABI32_0_0YGFloatOptional(yogaFloatFromFabricFloat(value));
}

inline ABI32_0_0YGValue yogaStyleValueFromFloat(const Float &value) {
  if (isnan(value) || value == kFloatUndefined) {
    return ABI32_0_0YGValueUndefined;
  }

  return {(float)value, ABI32_0_0YGUnitPoint};
}

inline LayoutMetrics layoutMetricsFromYogaNode(ABI32_0_0YGNode &yogaNode) {
  LayoutMetrics layoutMetrics;

  ABI32_0_0YGLayout layout = yogaNode.getLayout();

  layoutMetrics.frame = Rect {
    Point {
      fabricFloatFromYogaFloat(layout.position[ABI32_0_0YGEdgeLeft]),
      fabricFloatFromYogaFloat(layout.position[ABI32_0_0YGEdgeTop])
    },
    Size {
      fabricFloatFromYogaFloat(layout.dimensions[ABI32_0_0YGDimensionWidth]),
      fabricFloatFromYogaFloat(layout.dimensions[ABI32_0_0YGDimensionHeight])
    }
  };

  layoutMetrics.borderWidth = EdgeInsets {
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeLeft]),
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeTop]),
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeRight]),
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeBottom])
  };

  layoutMetrics.contentInsets = EdgeInsets {
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeLeft] + layout.padding[ABI32_0_0YGEdgeLeft]),
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeTop] + layout.padding[ABI32_0_0YGEdgeTop]),
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeRight] + layout.padding[ABI32_0_0YGEdgeRight]),
    fabricFloatFromYogaFloat(layout.border[ABI32_0_0YGEdgeBottom] + layout.padding[ABI32_0_0YGEdgeBottom])
  };

  layoutMetrics.displayType =
    yogaNode.getStyle().display == ABI32_0_0YGDisplayNone ? DisplayType::None : DisplayType::Flex;

  layoutMetrics.layoutDirection =
    layout.direction == ABI32_0_0YGDirectionRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  return layoutMetrics;
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGDirection &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "inherit") { result = ABI32_0_0YGDirectionInherit; return; }
  if (stringValue == "ltr") { result = ABI32_0_0YGDirectionLTR; return; }
  if (stringValue == "rtl") { result = ABI32_0_0YGDirectionRTL; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGFlexDirection &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "column") { result = ABI32_0_0YGFlexDirectionColumn; return; }
  if (stringValue == "column-reverse") { result = ABI32_0_0YGFlexDirectionColumnReverse; return; }
  if (stringValue == "row") { result = ABI32_0_0YGFlexDirectionRow; return; }
  if (stringValue == "row-reverse") { result = ABI32_0_0YGFlexDirectionRowReverse; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGJustify &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "flex-start") { result = ABI32_0_0YGJustifyFlexStart; return; }
  if (stringValue == "center") { result = ABI32_0_0YGJustifyCenter; return; }
  if (stringValue == "flex-end") { result = ABI32_0_0YGJustifyFlexEnd; return; }
  if (stringValue == "space-between") { result = ABI32_0_0YGJustifySpaceBetween; return; }
  if (stringValue == "space-around") { result = ABI32_0_0YGJustifySpaceAround; return; }
  if (stringValue == "space-evenly") { result = ABI32_0_0YGJustifySpaceEvenly; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGAlign &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "auto") { result = ABI32_0_0YGAlignAuto; return; }
  if (stringValue == "flex-start") { result = ABI32_0_0YGAlignFlexStart; return; }
  if (stringValue == "center") { result = ABI32_0_0YGAlignCenter; return; }
  if (stringValue == "flex-end") { result = ABI32_0_0YGAlignFlexEnd; return; }
  if (stringValue == "stretch") { result = ABI32_0_0YGAlignStretch; return; }
  if (stringValue == "baseline") { result = ABI32_0_0YGAlignBaseline; return; }
  if (stringValue == "between") { result = ABI32_0_0YGAlignSpaceBetween; return; }
  if (stringValue == "space-around") { result = ABI32_0_0YGAlignSpaceAround; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGPositionType &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "relative") { result = ABI32_0_0YGPositionTypeRelative; return; }
  if (stringValue == "absolute") { result = ABI32_0_0YGPositionTypeAbsolute; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGWrap &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "no-wrap") { result = ABI32_0_0YGWrapNoWrap; return; }
  if (stringValue == "wrap") { result = ABI32_0_0YGWrapWrap; return; }
  if (stringValue == "wrap-reverse") { result = ABI32_0_0YGWrapWrapReverse; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGOverflow &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "visible") { result = ABI32_0_0YGOverflowVisible; return; }
  if (stringValue == "hidden") { result = ABI32_0_0YGOverflowHidden; return; }
  if (stringValue == "scroll") { result = ABI32_0_0YGOverflowScroll; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGDisplay &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "flex") { result = ABI32_0_0YGDisplayFlex; return; }
  if (stringValue == "none") { result = ABI32_0_0YGDisplayNone; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGValue &result) {
  if (value.isNumber()) {
    result = yogaStyleValueFromFloat(value.asDouble());
    return;
  } else if (value.isString()) {
    const auto stringValue = value.asString();
    if (stringValue == "auto") {
      result = ABI32_0_0YGValueUndefined;
      return;
    } else {
      if (stringValue.back() == '%') {
        result = { folly::to<float>(stringValue.substr(0, stringValue.length() - 1)), ABI32_0_0YGUnitPercent };
        return;
      } else {
        result = { folly::to<float>(stringValue), ABI32_0_0YGUnitPoint };
        return;
      }
    }
  }
  result = ABI32_0_0YGValueUndefined;
}

inline void fromDynamic(const folly::dynamic &value, ABI32_0_0YGFloatOptional &result) {
  if (value.isNumber()) {
    result = ABI32_0_0YGFloatOptional(value.asDouble());
    return;
  } else if (value.isString()) {
    const auto stringValue = value.asString();
    if (stringValue == "auto") {
      result = ABI32_0_0YGFloatOptional();
      return;
    }
  }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, Transform &result) {
  assert(value.isArray());
  Transform transformMatrix;
  for (const auto &tranformConfiguration : value) {
    assert(tranformConfiguration.isObject());
    auto pair = *tranformConfiguration.items().begin();
    const auto &operation = pair.first.asString();
    const auto &parameters = pair.second;

    if (operation == "matrix") {
      assert(parameters.isArray());
      assert(parameters.size() == transformMatrix.matrix.size());
      int i = 0;
      for (auto item : parameters) {
        transformMatrix.matrix[i++] = (Float)item.asDouble();
      }
    } else if (operation == "perspective") {
      transformMatrix = transformMatrix * Transform::Perspective((Float)parameters.asDouble());
    } else if (operation == "rotateX") {
      transformMatrix = transformMatrix * Transform::Rotate((Float)parameters.asDouble(), 0, 0);
    } else if (operation == "rotateY") {
      transformMatrix = transformMatrix * Transform::Rotate(0, (Float)parameters.asDouble(), 0);
    } else if (operation == "rotateZ") {
      transformMatrix = transformMatrix * Transform::Rotate(0, 0, (Float)parameters.asDouble());
    } else if (operation == "scale") {
      transformMatrix = transformMatrix * Transform::Scale((Float)parameters.asDouble(), (Float)parameters.asDouble(), (Float)parameters.asDouble());
    } else if (operation == "scaleX") {
      transformMatrix = transformMatrix * Transform::Scale((Float)parameters.asDouble(), 0, 0);
    } else if (operation == "scaleY") {
      transformMatrix = transformMatrix * Transform::Scale(0, (Float)parameters.asDouble(), 0);
    } else if (operation == "scaleZ") {
      transformMatrix = transformMatrix * Transform::Scale(0, 0, (Float)parameters.asDouble());
    } else if (operation == "translate") {
      transformMatrix = transformMatrix * Transform::Translate(parameters[0].asDouble(), parameters[1].asDouble(), 0);
    } else if (operation == "translateX") {
      transformMatrix = transformMatrix * Transform::Translate(parameters.asDouble(), 0, 0);
    } else if (operation == "translateY") {
      transformMatrix = transformMatrix * Transform::Translate(0, parameters.asDouble(), 0);
    } else if (operation == "skewX") {
      transformMatrix = transformMatrix * Transform::Skew(parameters.asDouble(), 0);
    } else if (operation == "skewY") {
      transformMatrix = transformMatrix * Transform::Skew(0, parameters.asDouble());
    }
  }

  result = transformMatrix;
}

inline void fromDynamic(const folly::dynamic &value, PointerEventsMode &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "auto") { result = PointerEventsMode::Auto; return; }
  if (stringValue == "none") { result = PointerEventsMode::None; return; }
  if (stringValue == "box-none") { result = PointerEventsMode::BoxNone; return; }
  if (stringValue == "box-only") { result = PointerEventsMode::BoxOnly; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, BorderStyle &result) {
  assert(value.isString());
  auto stringValue = value.asString();
  if (stringValue == "solid") { result = BorderStyle::Solid; return; }
  if (stringValue == "dotted") { result = BorderStyle::Dotted; return; }
  if (stringValue == "dashed") { result = BorderStyle::Dashed; return; }
  abort();
}

inline std::string toString(const std::array<float, ABI32_0_0YGDimensionCount> &dimensions) {
  return "{" + folly::to<std::string>(dimensions[0]) + ", " + folly::to<std::string>(dimensions[1]) + "}";
}

inline std::string toString(const std::array<float, 4> &position) {
  return "{" + folly::to<std::string>(position[0]) + ", " + folly::to<std::string>(position[1]) + "}";
}

inline std::string toString(const std::array<float, ABI32_0_0YGEdgeCount> &edges) {
  return "{" +
    folly::to<std::string>(edges[0]) + ", " +
    folly::to<std::string>(edges[1]) + ", " +
    folly::to<std::string>(edges[2]) + ", " +
    folly::to<std::string>(edges[3]) + "}";
}

inline std::string toString(const ABI32_0_0YGDirection &value) {
  switch (value) {
    case ABI32_0_0YGDirectionInherit: return "inherit";
    case ABI32_0_0YGDirectionLTR: return "ltr";
    case ABI32_0_0YGDirectionRTL: return "rtl";
  }
}

inline std::string toString(const ABI32_0_0YGFlexDirection &value) {
  switch (value) {
    case ABI32_0_0YGFlexDirectionColumn: return "column";
    case ABI32_0_0YGFlexDirectionColumnReverse: return "column-reverse";
    case ABI32_0_0YGFlexDirectionRow: return "row";
    case ABI32_0_0YGFlexDirectionRowReverse: return "row-reverse";
  }
}

inline std::string toString(const ABI32_0_0YGJustify &value) {
  switch (value) {
    case ABI32_0_0YGJustifyFlexStart: return "flex-start";
    case ABI32_0_0YGJustifyCenter: return "center";
    case ABI32_0_0YGJustifyFlexEnd: return "flex-end";
    case ABI32_0_0YGJustifySpaceBetween: return "space-between";
    case ABI32_0_0YGJustifySpaceAround: return "space-around";
    case ABI32_0_0YGJustifySpaceEvenly: return "space-evenly";
  }
}

inline std::string toString(const ABI32_0_0YGAlign &value) {
  switch (value) {
    case ABI32_0_0YGAlignAuto: return "auto";
    case ABI32_0_0YGAlignFlexStart: return "flex-start";
    case ABI32_0_0YGAlignCenter: return "center";
    case ABI32_0_0YGAlignFlexEnd: return "flex-end";
    case ABI32_0_0YGAlignStretch: return "stretch";
    case ABI32_0_0YGAlignBaseline: return "baseline";
    case ABI32_0_0YGAlignSpaceBetween: return "space-between";
    case ABI32_0_0YGAlignSpaceAround: return "space-around";
  }
}

inline std::string toString(const ABI32_0_0YGPositionType &value) {
  switch (value) {
    case ABI32_0_0YGPositionTypeRelative: return "relative";
    case ABI32_0_0YGPositionTypeAbsolute: return "absolute";
  }
}

inline std::string toString(const ABI32_0_0YGWrap &value) {
  switch (value) {
    case ABI32_0_0YGWrapNoWrap: return "no-wrap";
    case ABI32_0_0YGWrapWrap: return "wrap";
    case ABI32_0_0YGWrapWrapReverse: return "wrap-reverse";
  }
}

inline std::string toString(const ABI32_0_0YGOverflow &value) {
  switch (value) {
    case ABI32_0_0YGOverflowVisible: return "visible";
    case ABI32_0_0YGOverflowScroll: return "scroll";
    case ABI32_0_0YGOverflowHidden: return "hidden";
  }
}

inline std::string toString(const ABI32_0_0YGDisplay &value) {
  switch (value) {
    case ABI32_0_0YGDisplayFlex: return "flex";
    case ABI32_0_0YGDisplayNone: return "none";
  }
}

inline std::string toString(const ABI32_0_0YGValue &value) {
  switch (value.unit) {
    case ABI32_0_0YGUnitUndefined: return "undefined";
    case ABI32_0_0YGUnitPoint: return folly::to<std::string>(value.value);
    case ABI32_0_0YGUnitPercent: return folly::to<std::string>(value.value) + "%";
    case ABI32_0_0YGUnitAuto: return "auto";
  }
}

inline std::string toString(const ABI32_0_0YGFloatOptional &value) {
  if (value.isUndefined()) {
    return "undefined";
  }

  return folly::to<std::string>(fabricFloatFromYogaFloat(value.getValue()));
}

inline std::string toString(const std::array<ABI32_0_0YGValue, ABI32_0_0YGDimensionCount> &value) {
  return "{" +
    toString(value[0]) + ", " +
    toString(value[1]) + "}";
}

inline std::string toString(const std::array<ABI32_0_0YGValue, ABI32_0_0YGEdgeCount> &value) {
  static std::array<std::string, ABI32_0_0YGEdgeCount> names = {
    {"left", "top", "right", "bottom", "start", "end", "horizontal", "vertical", "all"}
  };

  std::string result;
  std::string separator = ", ";

  for (int i = 0; i < ABI32_0_0YGEdgeCount; i++) {
    if (value[i].unit == ABI32_0_0YGUnitUndefined) {
      continue;
    }
    result += names[i] + ": " + toString(value[i]) + separator;
  }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return "{" + result + "}";
}

} // namespace ReactABI32_0_0
} // namespace facebook
