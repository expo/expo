/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <ReactABI34_0_0/components/view/primitives.h>
#include <ReactABI34_0_0/core/LayoutMetrics.h>
#include <ReactABI34_0_0/graphics/Geometry.h>
#include <ABI34_0_0yoga/ABI34_0_0YGEnums.h>
#include <ABI34_0_0yoga/ABI34_0_0YGNode.h>
#include <ABI34_0_0yoga/ABI34_0_0Yoga.h>
#include <cmath>

namespace facebook {
namespace ReactABI34_0_0 {

inline Float floatFromYogaFloat(float value) {
  if (value == ABI34_0_0YGUndefined) {
    return kFloatUndefined;
  }

  return (Float)value;
}

inline float ABI34_0_0yogaFloatFromFloat(Float value) {
  if (value == kFloatUndefined) {
    return ABI34_0_0YGUndefined;
  }

  return (float)value;
}

inline Float floatFromYogaOptionalFloat(ABI34_0_0YGFloatOptional value) {
  if (value.isUndefined()) {
    return kFloatUndefined;
  }

  return floatFromYogaFloat(value.unwrap());
}

inline ABI34_0_0YGFloatOptional ABI34_0_0yogaOptionalFloatFromFloat(Float value) {
  if (value == kFloatUndefined) {
    return ABI34_0_0YGFloatOptional();
  }

  return ABI34_0_0YGFloatOptional(ABI34_0_0yogaFloatFromFloat(value));
}

inline ABI34_0_0YGValue ABI34_0_0yogaStyleValueFromFloat(const Float &value) {
  if (std::isnan(value) || value == kFloatUndefined) {
    return ABI34_0_0YGValueUndefined;
  }

  return {(float)value, ABI34_0_0YGUnitPoint};
}

inline folly::Optional<Float> optionalFloatFromYogaValue(
    const ABI34_0_0YGValue value,
    folly::Optional<Float> base = {}) {
  switch (value.unit) {
    case ABI34_0_0YGUnitUndefined:
      return {};
    case ABI34_0_0YGUnitPoint:
      return floatFromYogaFloat(value.value);
    case ABI34_0_0YGUnitPercent:
      return base.has_value()
          ? folly::Optional<Float>(
                base.value() * floatFromYogaFloat(value.value))
          : folly::Optional<Float>();
    case ABI34_0_0YGUnitAuto:
      return {};
  }
}

inline LayoutMetrics layoutMetricsFromYogaNode(ABI34_0_0YGNode &ABI34_0_0yogaNode) {
  auto layoutMetrics = LayoutMetrics{};

  layoutMetrics.frame =
      Rect{Point{floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetLeft(&ABI34_0_0yogaNode)),
                 floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetTop(&ABI34_0_0yogaNode))},
           Size{floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetWidth(&ABI34_0_0yogaNode)),
                floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetHeight(&ABI34_0_0yogaNode))}};

  layoutMetrics.borderWidth = EdgeInsets{
      floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeLeft)),
      floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeTop)),
      floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeRight)),
      floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeBottom))};

  layoutMetrics.contentInsets = EdgeInsets{
      layoutMetrics.borderWidth.left +
          floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeLeft)),
      layoutMetrics.borderWidth.top +
          floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeTop)),
      layoutMetrics.borderWidth.right +
          floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeRight)),
      layoutMetrics.borderWidth.bottom +
          floatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(&ABI34_0_0yogaNode, ABI34_0_0YGEdgeBottom))};

  layoutMetrics.displayType = ABI34_0_0yogaNode.getStyle().display == ABI34_0_0YGDisplayNone
      ? DisplayType::None
      : DisplayType::Flex;

  layoutMetrics.layoutDirection =
      ABI34_0_0YGNodeLayoutGetDirection(&ABI34_0_0yogaNode) == ABI34_0_0YGDirectionRTL
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;

  return layoutMetrics;
}

inline ABI34_0_0YGDirection ABI34_0_0yogaDirectionFromLayoutDirection(LayoutDirection direction) {
  switch (direction) {
    case LayoutDirection::Undefined:
      return ABI34_0_0YGDirectionInherit;
    case LayoutDirection::LeftToRight:
      return ABI34_0_0YGDirectionLTR;
    case LayoutDirection::RightToLeft:
      return ABI34_0_0YGDirectionRTL;
  }
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGDirection &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "inherit") {
    result = ABI34_0_0YGDirectionInherit;
    return;
  }
  if (stringValue == "ltr") {
    result = ABI34_0_0YGDirectionLTR;
    return;
  }
  if (stringValue == "rtl") {
    result = ABI34_0_0YGDirectionRTL;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGFlexDirection &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "column") {
    result = ABI34_0_0YGFlexDirectionColumn;
    return;
  }
  if (stringValue == "column-reverse") {
    result = ABI34_0_0YGFlexDirectionColumnReverse;
    return;
  }
  if (stringValue == "row") {
    result = ABI34_0_0YGFlexDirectionRow;
    return;
  }
  if (stringValue == "row-reverse") {
    result = ABI34_0_0YGFlexDirectionRowReverse;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGJustify &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "flex-start") {
    result = ABI34_0_0YGJustifyFlexStart;
    return;
  }
  if (stringValue == "center") {
    result = ABI34_0_0YGJustifyCenter;
    return;
  }
  if (stringValue == "flex-end") {
    result = ABI34_0_0YGJustifyFlexEnd;
    return;
  }
  if (stringValue == "space-between") {
    result = ABI34_0_0YGJustifySpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = ABI34_0_0YGJustifySpaceAround;
    return;
  }
  if (stringValue == "space-evenly") {
    result = ABI34_0_0YGJustifySpaceEvenly;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGAlign &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = ABI34_0_0YGAlignAuto;
    return;
  }
  if (stringValue == "flex-start") {
    result = ABI34_0_0YGAlignFlexStart;
    return;
  }
  if (stringValue == "center") {
    result = ABI34_0_0YGAlignCenter;
    return;
  }
  if (stringValue == "flex-end") {
    result = ABI34_0_0YGAlignFlexEnd;
    return;
  }
  if (stringValue == "stretch") {
    result = ABI34_0_0YGAlignStretch;
    return;
  }
  if (stringValue == "baseline") {
    result = ABI34_0_0YGAlignBaseline;
    return;
  }
  if (stringValue == "between") {
    result = ABI34_0_0YGAlignSpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = ABI34_0_0YGAlignSpaceAround;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGPositionType &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "relative") {
    result = ABI34_0_0YGPositionTypeRelative;
    return;
  }
  if (stringValue == "absolute") {
    result = ABI34_0_0YGPositionTypeAbsolute;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGWrap &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "no-wrap") {
    result = ABI34_0_0YGWrapNoWrap;
    return;
  }
  if (stringValue == "wrap") {
    result = ABI34_0_0YGWrapWrap;
    return;
  }
  if (stringValue == "wrap-reverse") {
    result = ABI34_0_0YGWrapWrapReverse;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGOverflow &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "visible") {
    result = ABI34_0_0YGOverflowVisible;
    return;
  }
  if (stringValue == "hidden") {
    result = ABI34_0_0YGOverflowHidden;
    return;
  }
  if (stringValue == "scroll") {
    result = ABI34_0_0YGOverflowScroll;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGDisplay &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "flex") {
    result = ABI34_0_0YGDisplayFlex;
    return;
  }
  if (stringValue == "none") {
    result = ABI34_0_0YGDisplayNone;
    return;
  }
  abort();
}

inline void fromRawValue(
    const RawValue &value,
    decltype(ABI34_0_0YGStyle{}.margin[0]) /* type is subject to change */ &result) {
  if (value.hasType<Float>()) {
    result = ABI34_0_0yogaStyleValueFromFloat((Float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = ABI34_0_0YGValueUndefined;
      return;
    } else {
      if (stringValue.back() == '%') {
        result = ABI34_0_0YGValue{
            folly::to<float>(stringValue.substr(0, stringValue.length() - 1)),
            ABI34_0_0YGUnitPercent};
        return;
      } else {
        result = ABI34_0_0YGValue{folly::to<float>(stringValue), ABI34_0_0YGUnitPoint};
        return;
      }
    }
  }
  result = ABI34_0_0YGValueUndefined;
}

inline void fromRawValue(const RawValue &value, ABI34_0_0YGFloatOptional &result) {
  if (value.hasType<float>()) {
    result = ABI34_0_0YGFloatOptional((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = ABI34_0_0YGFloatOptional();
      return;
    }
  }
  abort();
}

inline void fromRawValue(const RawValue &value, Transform &result) {
  assert(value.hasType<std::vector<RawValue>>());
  auto transformMatrix = Transform{};
  auto configurations = (std::vector<RawValue>)value;

  for (const auto &configuration : configurations) {
    auto configurationPair =
        (std::unordered_map<std::string, RawValue>)configuration;
    auto pair = configurationPair.begin();
    auto operation = pair->first;
    auto &parameters = pair->second;

    if (operation == "matrix") {
      assert(parameters.hasType<std::vector<Float>>());
      auto numbers = (std::vector<Float>)parameters;
      assert(numbers.size() == transformMatrix.matrix.size());
      auto i = 0;
      for (auto number : numbers) {
        transformMatrix.matrix[i++] = number;
      }
    } else if (operation == "perspective") {
      transformMatrix =
          transformMatrix * Transform::Perspective((Float)parameters);
    } else if (operation == "rotateX") {
      transformMatrix =
          transformMatrix * Transform::Rotate((Float)parameters, 0, 0);
    } else if (operation == "rotateY") {
      transformMatrix =
          transformMatrix * Transform::Rotate(0, (Float)parameters, 0);
    } else if (operation == "rotateZ") {
      transformMatrix =
          transformMatrix * Transform::Rotate(0, 0, (Float)parameters);
    } else if (operation == "scale") {
      auto number = (Float)parameters;
      transformMatrix =
          transformMatrix * Transform::Scale(number, number, number);
    } else if (operation == "scaleX") {
      transformMatrix =
          transformMatrix * Transform::Scale((Float)parameters, 0, 0);
    } else if (operation == "scaleY") {
      transformMatrix =
          transformMatrix * Transform::Scale(0, (Float)parameters, 0);
    } else if (operation == "scaleZ") {
      transformMatrix =
          transformMatrix * Transform::Scale(0, 0, (Float)parameters);
    } else if (operation == "translate") {
      auto numbers = (std::vector<Float>)parameters;
      transformMatrix = transformMatrix *
          Transform::Translate(numbers.at(0), numbers.at(1), 0);
    } else if (operation == "translateX") {
      transformMatrix =
          transformMatrix * Transform::Translate((Float)parameters, 0, 0);
    } else if (operation == "translateY") {
      transformMatrix =
          transformMatrix * Transform::Translate(0, (Float)parameters, 0);
    } else if (operation == "skewX") {
      transformMatrix = transformMatrix * Transform::Skew((Float)parameters, 0);
    } else if (operation == "skewY") {
      transformMatrix = transformMatrix * Transform::Skew(0, (Float)parameters);
    }
  }

  result = transformMatrix;
}

inline void fromRawValue(const RawValue &value, PointerEventsMode &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = PointerEventsMode::Auto;
    return;
  }
  if (stringValue == "none") {
    result = PointerEventsMode::None;
    return;
  }
  if (stringValue == "box-none") {
    result = PointerEventsMode::BoxNone;
    return;
  }
  if (stringValue == "box-only") {
    result = PointerEventsMode::BoxOnly;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, BorderStyle &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "solid") {
    result = BorderStyle::Solid;
    return;
  }
  if (stringValue == "dotted") {
    result = BorderStyle::Dotted;
    return;
  }
  if (stringValue == "dashed") {
    result = BorderStyle::Dashed;
    return;
  }
  abort();
}

inline std::string toString(
    const std::array<float, ABI34_0_0yoga::enums::count<ABI34_0_0YGDimension>()> &dimensions) {
  return "{" + folly::to<std::string>(dimensions[0]) + ", " +
      folly::to<std::string>(dimensions[1]) + "}";
}

inline std::string toString(const std::array<float, 4> &position) {
  return "{" + folly::to<std::string>(position[0]) + ", " +
      folly::to<std::string>(position[1]) + "}";
}

inline std::string toString(
    const std::array<float, ABI34_0_0yoga::enums::count<ABI34_0_0YGEdge>()> &edges) {
  return "{" + folly::to<std::string>(edges[0]) + ", " +
      folly::to<std::string>(edges[1]) + ", " +
      folly::to<std::string>(edges[2]) + ", " +
      folly::to<std::string>(edges[3]) + "}";
}

inline std::string toString(const ABI34_0_0YGDirection &value) {
  switch (value) {
    case ABI34_0_0YGDirectionInherit:
      return "inherit";
    case ABI34_0_0YGDirectionLTR:
      return "ltr";
    case ABI34_0_0YGDirectionRTL:
      return "rtl";
  }
}

inline std::string toString(const ABI34_0_0YGFlexDirection &value) {
  switch (value) {
    case ABI34_0_0YGFlexDirectionColumn:
      return "column";
    case ABI34_0_0YGFlexDirectionColumnReverse:
      return "column-reverse";
    case ABI34_0_0YGFlexDirectionRow:
      return "row";
    case ABI34_0_0YGFlexDirectionRowReverse:
      return "row-reverse";
  }
}

inline std::string toString(const ABI34_0_0YGJustify &value) {
  switch (value) {
    case ABI34_0_0YGJustifyFlexStart:
      return "flex-start";
    case ABI34_0_0YGJustifyCenter:
      return "center";
    case ABI34_0_0YGJustifyFlexEnd:
      return "flex-end";
    case ABI34_0_0YGJustifySpaceBetween:
      return "space-between";
    case ABI34_0_0YGJustifySpaceAround:
      return "space-around";
    case ABI34_0_0YGJustifySpaceEvenly:
      return "space-evenly";
  }
}

inline std::string toString(const ABI34_0_0YGAlign &value) {
  switch (value) {
    case ABI34_0_0YGAlignAuto:
      return "auto";
    case ABI34_0_0YGAlignFlexStart:
      return "flex-start";
    case ABI34_0_0YGAlignCenter:
      return "center";
    case ABI34_0_0YGAlignFlexEnd:
      return "flex-end";
    case ABI34_0_0YGAlignStretch:
      return "stretch";
    case ABI34_0_0YGAlignBaseline:
      return "baseline";
    case ABI34_0_0YGAlignSpaceBetween:
      return "space-between";
    case ABI34_0_0YGAlignSpaceAround:
      return "space-around";
  }
}

inline std::string toString(const ABI34_0_0YGPositionType &value) {
  switch (value) {
    case ABI34_0_0YGPositionTypeRelative:
      return "relative";
    case ABI34_0_0YGPositionTypeAbsolute:
      return "absolute";
  }
}

inline std::string toString(const ABI34_0_0YGWrap &value) {
  switch (value) {
    case ABI34_0_0YGWrapNoWrap:
      return "no-wrap";
    case ABI34_0_0YGWrapWrap:
      return "wrap";
    case ABI34_0_0YGWrapWrapReverse:
      return "wrap-reverse";
  }
}

inline std::string toString(const ABI34_0_0YGOverflow &value) {
  switch (value) {
    case ABI34_0_0YGOverflowVisible:
      return "visible";
    case ABI34_0_0YGOverflowScroll:
      return "scroll";
    case ABI34_0_0YGOverflowHidden:
      return "hidden";
  }
}

inline std::string toString(const ABI34_0_0YGDisplay &value) {
  switch (value) {
    case ABI34_0_0YGDisplayFlex:
      return "flex";
    case ABI34_0_0YGDisplayNone:
      return "none";
  }
}

inline std::string toString(const ABI34_0_0YGValue &value) {
  switch (value.unit) {
    case ABI34_0_0YGUnitUndefined:
      return "undefined";
    case ABI34_0_0YGUnitPoint:
      return folly::to<std::string>(value.value);
    case ABI34_0_0YGUnitPercent:
      return folly::to<std::string>(value.value) + "%";
    case ABI34_0_0YGUnitAuto:
      return "auto";
  }
}

inline std::string toString(const ABI34_0_0YGFloatOptional &value) {
  if (value.isUndefined()) {
    return "undefined";
  }

  return folly::to<std::string>(floatFromYogaFloat(value.unwrap()));
}

inline std::string toString(const ABI34_0_0YGStyle::Dimensions &value) {
  return "{" + toString(value[0]) + ", " + toString(value[1]) + "}";
}

inline std::string toString(const ABI34_0_0YGStyle::Edges &value) {
  static std::array<std::string, ABI34_0_0yoga::enums::count<ABI34_0_0YGEdge>()> names = {
      {"left",
       "top",
       "right",
       "bottom",
       "start",
       "end",
       "horizontal",
       "vertical",
       "all"}};

  auto result = std::string{};
  auto separator = std::string{", "};

  for (auto i = 0; i < ABI34_0_0yoga::enums::count<ABI34_0_0YGEdge>(); i++) {
    ABI34_0_0YGValue v = value[i];
    if (v.unit == ABI34_0_0YGUnitUndefined) {
      continue;
    }
    result += names[i] + ": " + toString(v) + separator;
  }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return "{" + result + "}";
}

} // namespace ReactABI34_0_0
} // namespace facebook
