/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <glog/logging.h>
#include <ABI42_0_0React/components/view/primitives.h>
#include <ABI42_0_0React/core/LayoutMetrics.h>
#include <ABI42_0_0React/graphics/Geometry.h>
#include <ABI42_0_0React/graphics/Transform.h>
#include <stdlib.h>
#include <ABI42_0_0yoga/ABI42_0_0YGEnums.h>
#include <ABI42_0_0yoga/ABI42_0_0YGNode.h>
#include <ABI42_0_0yoga/ABI42_0_0Yoga.h>
#include <cmath>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Yoga's `float` <-> ABI42_0_0React Native's `Float` (can be `double` or `float`)
 *
 * Regular Yoga `float` values represent some onscreen-position-related values.
 * They can be real numbers or special value `ABI42_0_0YGUndefined` (which actually is
 * `NaN`). Conceptually, layout computation process inside Yoga should never
 * produce `NaN` values from non-`NaN` values. At the same time, ` ABI42_0_0YGUndefined`
 * values have special "no limit" meaning in Yoga, therefore ` ABI42_0_0YGUndefined`
 * usually corresponds to `Infinity` value.
 */
inline Float floatFromYogaFloat(float value) {
  static_assert(
      ABI42_0_0YGUndefined != ABI42_0_0YGUndefined,
      "The code of this function assumes that ABI42_0_0YGUndefined is NaN.");
  if (std::isnan(value) /* means: `value == ABI42_0_0YGUndefined` */) {
    return std::numeric_limits<Float>::infinity();
  }

  return (Float)value;
}

inline float yogaFloatFromFloat(Float value) {
  if (std::isinf(value)) {
    return ABI42_0_0YGUndefined;
  }

  return (float)value;
}

/*
 * `ABI42_0_0YGFloatOptional` <-> ABI42_0_0React Native's `Float`
 *
 * `ABI42_0_0YGFloatOptional` represents optional dimensionless float values in Yoga
 * Style object (e.g. `flex`). The most suitable analogy to empty
 * `ABI42_0_0YGFloatOptional` is `NaN` value.
 * `ABI42_0_0YGFloatOptional` values are usually parsed from some outside data source
 * which usually has some special corresponding representation for an empty
 * value.
 */
inline Float floatFromYogaOptionalFloat(ABI42_0_0YGFloatOptional value) {
  if (value.isUndefined()) {
    return std::numeric_limits<Float>::quiet_NaN();
  }

  return floatFromYogaFloat(value.unwrap());
}

inline ABI42_0_0YGFloatOptional yogaOptionalFloatFromFloat(Float value) {
  if (std::isnan(value)) {
    return ABI42_0_0YGFloatOptional();
  }

  return ABI42_0_0YGFloatOptional((float)value);
}

/*
 * `ABI42_0_0YGValue` <-> `ABI42_0_0React Native's `Float`
 *
 * `ABI42_0_0YGValue` represents optional dimensionful (a real number and some unit, e.g.
 * pixels).
 */
inline ABI42_0_0YGValue yogaStyleValueFromFloat(
    const Float &value,
    ABI42_0_0YGUnit unit = ABI42_0_0YGUnitPoint) {
  if (std::isnan(value)) {
    return ABI42_0_0YGValueUndefined;
  }

  return {(float)value, unit};
}

inline folly::Optional<Float> optionalFloatFromYogaValue(
    const ABI42_0_0YGValue value,
    folly::Optional<Float> base = {}) {
  switch (value.unit) {
    case ABI42_0_0YGUnitUndefined:
      return {};
    case ABI42_0_0YGUnitPoint:
      return floatFromYogaFloat(value.value);
    case ABI42_0_0YGUnitPercent:
      return base.has_value()
          ? folly::Optional<Float>(
                base.value() * floatFromYogaFloat(value.value))
          : folly::Optional<Float>();
    case ABI42_0_0YGUnitAuto:
      return {};
  }
}

inline LayoutMetrics layoutMetricsFromYogaNode(ABI42_0_0YGNode &yogaNode) {
  auto layoutMetrics = LayoutMetrics{};

  layoutMetrics.frame =
      Rect{Point{floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetLeft(&yogaNode)),
                 floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetTop(&yogaNode))},
           Size{floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetWidth(&yogaNode)),
                floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetHeight(&yogaNode))}};

  layoutMetrics.borderWidth = EdgeInsets{
      floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetBorder(&yogaNode, ABI42_0_0YGEdgeLeft)),
      floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetBorder(&yogaNode, ABI42_0_0YGEdgeTop)),
      floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetBorder(&yogaNode, ABI42_0_0YGEdgeRight)),
      floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetBorder(&yogaNode, ABI42_0_0YGEdgeBottom))};

  layoutMetrics.contentInsets = EdgeInsets{
      layoutMetrics.borderWidth.left +
          floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetPadding(&yogaNode, ABI42_0_0YGEdgeLeft)),
      layoutMetrics.borderWidth.top +
          floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetPadding(&yogaNode, ABI42_0_0YGEdgeTop)),
      layoutMetrics.borderWidth.right +
          floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetPadding(&yogaNode, ABI42_0_0YGEdgeRight)),
      layoutMetrics.borderWidth.bottom +
          floatFromYogaFloat(ABI42_0_0YGNodeLayoutGetPadding(&yogaNode, ABI42_0_0YGEdgeBottom))};

  layoutMetrics.displayType = yogaNode.getStyle().display() == ABI42_0_0YGDisplayNone
      ? DisplayType::None
      : DisplayType::Flex;

  layoutMetrics.layoutDirection =
      ABI42_0_0YGNodeLayoutGetDirection(&yogaNode) == ABI42_0_0YGDirectionRTL
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;

  return layoutMetrics;
}

inline ABI42_0_0YGDirection yogaDirectionFromLayoutDirection(LayoutDirection direction) {
  switch (direction) {
    case LayoutDirection::Undefined:
      return ABI42_0_0YGDirectionInherit;
    case LayoutDirection::LeftToRight:
      return ABI42_0_0YGDirectionLTR;
    case LayoutDirection::RightToLeft:
      return ABI42_0_0YGDirectionRTL;
  }
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGDirection &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "inherit") {
    result = ABI42_0_0YGDirectionInherit;
    return;
  }
  if (stringValue == "ltr") {
    result = ABI42_0_0YGDirectionLTR;
    return;
  }
  if (stringValue == "rtl") {
    result = ABI42_0_0YGDirectionRTL;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGDirection:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGFlexDirection &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "row") {
    result = ABI42_0_0YGFlexDirectionRow;
    return;
  }
  if (stringValue == "column") {
    result = ABI42_0_0YGFlexDirectionColumn;
    return;
  }
  if (stringValue == "column-reverse") {
    result = ABI42_0_0YGFlexDirectionColumnReverse;
    return;
  }
  if (stringValue == "row-reverse") {
    result = ABI42_0_0YGFlexDirectionRowReverse;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGFlexDirection:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGJustify &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "flex-start") {
    result = ABI42_0_0YGJustifyFlexStart;
    return;
  }
  if (stringValue == "center") {
    result = ABI42_0_0YGJustifyCenter;
    return;
  }
  if (stringValue == "flex-end") {
    result = ABI42_0_0YGJustifyFlexEnd;
    return;
  }
  if (stringValue == "space-between") {
    result = ABI42_0_0YGJustifySpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = ABI42_0_0YGJustifySpaceAround;
    return;
  }
  if (stringValue == "space-evenly") {
    result = ABI42_0_0YGJustifySpaceEvenly;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGJustify:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGAlign &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = ABI42_0_0YGAlignAuto;
    return;
  }
  if (stringValue == "flex-start") {
    result = ABI42_0_0YGAlignFlexStart;
    return;
  }
  if (stringValue == "center") {
    result = ABI42_0_0YGAlignCenter;
    return;
  }
  if (stringValue == "flex-end") {
    result = ABI42_0_0YGAlignFlexEnd;
    return;
  }
  if (stringValue == "stretch") {
    result = ABI42_0_0YGAlignStretch;
    return;
  }
  if (stringValue == "baseline") {
    result = ABI42_0_0YGAlignBaseline;
    return;
  }
  if (stringValue == "between") {
    result = ABI42_0_0YGAlignSpaceBetween;
    return;
  }
  if (stringValue == "space-around") {
    result = ABI42_0_0YGAlignSpaceAround;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGAlign:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGPositionType &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "relative") {
    result = ABI42_0_0YGPositionTypeRelative;
    return;
  }
  if (stringValue == "absolute") {
    result = ABI42_0_0YGPositionTypeAbsolute;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGPositionType:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGWrap &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "nowrap") {
    result = ABI42_0_0YGWrapNoWrap;
    return;
  }
  if (stringValue == "wrap") {
    result = ABI42_0_0YGWrapWrap;
    return;
  }
  if (stringValue == "wrap-reverse") {
    result = ABI42_0_0YGWrapWrapReverse;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGWrap:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGOverflow &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "visible") {
    result = ABI42_0_0YGOverflowVisible;
    return;
  }
  if (stringValue == "hidden") {
    result = ABI42_0_0YGOverflowHidden;
    return;
  }
  if (stringValue == "scroll") {
    result = ABI42_0_0YGOverflowScroll;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGOverflow:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGDisplay &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "flex") {
    result = ABI42_0_0YGDisplayFlex;
    return;
  }
  if (stringValue == "none") {
    result = ABI42_0_0YGDisplayNone;
    return;
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGDisplay:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGStyle::ValueRepr &result) {
  if (value.hasType<Float>()) {
    result = yogaStyleValueFromFloat((Float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = ABI42_0_0YGValueUndefined;
      return;
    } else {
      if (stringValue.back() == '%') {
        result = ABI42_0_0YGValue{
            folly::to<float>(stringValue.substr(0, stringValue.length() - 1)),
            ABI42_0_0YGUnitPercent};
        return;
      } else {
        result = ABI42_0_0YGValue{folly::to<float>(stringValue), ABI42_0_0YGUnitPoint};
        return;
      }
    }
  }
  result = ABI42_0_0YGValueUndefined;
}

inline void fromRawValue(const RawValue &value, ABI42_0_0YGFloatOptional &result) {
  if (value.hasType<float>()) {
    result = ABI42_0_0YGFloatOptional((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = ABI42_0_0YGFloatOptional();
      return;
    }
  }
  LOG(FATAL) << "Could not parse ABI42_0_0YGFloatOptional";
  assert(false);
}

inline Float toRadians(const RawValue &value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  char *suffixStart;
  double num = strtod(
      stringValue.c_str(), &suffixStart); // can't use std::stod, probably
                                          // because of old Android NDKs
  if (0 == strncmp(suffixStart, "deg", 3)) {
    return num * M_PI / 180;
  }
  return num; // assume suffix is "rad"
}

inline void fromRawValue(const RawValue &value, Transform &result) {
  assert(value.hasType<std::vector<RawValue>>());
  auto transformMatrix = Transform{};
  auto configurations = static_cast<std::vector<RawValue>>(value);

  for (const auto &configuration : configurations) {
    if (!configuration.hasType<better::map<std::string, RawValue>>()) {
      // TODO: The following checks have to be removed after codegen is shipped.
      // See T45151459.
      continue;
    }

    auto configurationPair =
        static_cast<better::map<std::string, RawValue>>(configuration);
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
          transformMatrix * Transform::Rotate(toRadians(parameters), 0, 0);
    } else if (operation == "rotateY") {
      transformMatrix =
          transformMatrix * Transform::Rotate(0, toRadians(parameters), 0);
    } else if (operation == "rotateZ" || operation == "rotate") {
      transformMatrix =
          transformMatrix * Transform::Rotate(0, 0, toRadians(parameters));
    } else if (operation == "scale") {
      auto number = (Float)parameters;
      transformMatrix =
          transformMatrix * Transform::Scale(number, number, number);
    } else if (operation == "scaleX") {
      transformMatrix =
          transformMatrix * Transform::Scale((Float)parameters, 1, 1);
    } else if (operation == "scaleY") {
      transformMatrix =
          transformMatrix * Transform::Scale(1, (Float)parameters, 1);
    } else if (operation == "scaleZ") {
      transformMatrix =
          transformMatrix * Transform::Scale(1, 1, (Float)parameters);
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
      transformMatrix =
          transformMatrix * Transform::Skew(toRadians(parameters), 0);
    } else if (operation == "skewY") {
      transformMatrix =
          transformMatrix * Transform::Skew(0, toRadians(parameters));
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
  LOG(FATAL) << "Could not parse PointerEventsMode:" << stringValue;
  assert(false);
}

inline void fromRawValue(const RawValue &value, BackfaceVisibility &result) {
  assert(value.hasType<std::string>());
  auto stringValue = (std::string)value;
  if (stringValue == "auto") {
    result = BackfaceVisibility::Auto;
    return;
  }
  if (stringValue == "visible") {
    result = BackfaceVisibility::Visible;
    return;
  }
  if (stringValue == "hidden") {
    result = BackfaceVisibility::Hidden;
    return;
  }
  LOG(FATAL) << "Could not parse BackfaceVisibility:" << stringValue;
  assert(false);
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
  LOG(FATAL) << "Could not parse BorderStyle:" << stringValue;
  assert(false);
}

inline std::string toString(
    const std::array<float, yoga::enums::count<ABI42_0_0YGDimension>()> &dimensions) {
  return "{" + folly::to<std::string>(dimensions[0]) + ", " +
      folly::to<std::string>(dimensions[1]) + "}";
}

inline std::string toString(const std::array<float, 4> &position) {
  return "{" + folly::to<std::string>(position[0]) + ", " +
      folly::to<std::string>(position[1]) + "}";
}

inline std::string toString(
    const std::array<float, yoga::enums::count<ABI42_0_0YGEdge>()> &edges) {
  return "{" + folly::to<std::string>(edges[0]) + ", " +
      folly::to<std::string>(edges[1]) + ", " +
      folly::to<std::string>(edges[2]) + ", " +
      folly::to<std::string>(edges[3]) + "}";
}

inline std::string toString(const ABI42_0_0YGDirection &value) {
  switch (value) {
    case ABI42_0_0YGDirectionInherit:
      return "inherit";
    case ABI42_0_0YGDirectionLTR:
      return "ltr";
    case ABI42_0_0YGDirectionRTL:
      return "rtl";
  }
}

inline std::string toString(const ABI42_0_0YGFlexDirection &value) {
  switch (value) {
    case ABI42_0_0YGFlexDirectionColumn:
      return "column";
    case ABI42_0_0YGFlexDirectionColumnReverse:
      return "column-reverse";
    case ABI42_0_0YGFlexDirectionRow:
      return "row";
    case ABI42_0_0YGFlexDirectionRowReverse:
      return "row-reverse";
  }
}

inline std::string toString(const ABI42_0_0YGJustify &value) {
  switch (value) {
    case ABI42_0_0YGJustifyFlexStart:
      return "flex-start";
    case ABI42_0_0YGJustifyCenter:
      return "center";
    case ABI42_0_0YGJustifyFlexEnd:
      return "flex-end";
    case ABI42_0_0YGJustifySpaceBetween:
      return "space-between";
    case ABI42_0_0YGJustifySpaceAround:
      return "space-around";
    case ABI42_0_0YGJustifySpaceEvenly:
      return "space-evenly";
  }
}

inline std::string toString(const ABI42_0_0YGAlign &value) {
  switch (value) {
    case ABI42_0_0YGAlignAuto:
      return "auto";
    case ABI42_0_0YGAlignFlexStart:
      return "flex-start";
    case ABI42_0_0YGAlignCenter:
      return "center";
    case ABI42_0_0YGAlignFlexEnd:
      return "flex-end";
    case ABI42_0_0YGAlignStretch:
      return "stretch";
    case ABI42_0_0YGAlignBaseline:
      return "baseline";
    case ABI42_0_0YGAlignSpaceBetween:
      return "space-between";
    case ABI42_0_0YGAlignSpaceAround:
      return "space-around";
  }
}

inline std::string toString(const ABI42_0_0YGPositionType &value) {
  switch (value) {
    case ABI42_0_0YGPositionTypeRelative:
      return "relative";
    case ABI42_0_0YGPositionTypeAbsolute:
      return "absolute";
  }
}

inline std::string toString(const ABI42_0_0YGWrap &value) {
  switch (value) {
    case ABI42_0_0YGWrapNoWrap:
      return "no-wrap";
    case ABI42_0_0YGWrapWrap:
      return "wrap";
    case ABI42_0_0YGWrapWrapReverse:
      return "wrap-reverse";
  }
}

inline std::string toString(const ABI42_0_0YGOverflow &value) {
  switch (value) {
    case ABI42_0_0YGOverflowVisible:
      return "visible";
    case ABI42_0_0YGOverflowScroll:
      return "scroll";
    case ABI42_0_0YGOverflowHidden:
      return "hidden";
  }
}

inline std::string toString(const ABI42_0_0YGDisplay &value) {
  switch (value) {
    case ABI42_0_0YGDisplayFlex:
      return "flex";
    case ABI42_0_0YGDisplayNone:
      return "none";
  }
}

inline std::string toString(const ABI42_0_0YGValue &value) {
  switch (value.unit) {
    case ABI42_0_0YGUnitUndefined:
      return "undefined";
    case ABI42_0_0YGUnitPoint:
      return folly::to<std::string>(value.value);
    case ABI42_0_0YGUnitPercent:
      return folly::to<std::string>(value.value) + "%";
    case ABI42_0_0YGUnitAuto:
      return "auto";
  }
}

inline std::string toString(const ABI42_0_0YGFloatOptional &value) {
  if (value.isUndefined()) {
    return "undefined";
  }

  return folly::to<std::string>(floatFromYogaFloat(value.unwrap()));
}

inline std::string toString(const ABI42_0_0YGStyle::Dimensions &value) {
  return "{" + toString(value[0]) + ", " + toString(value[1]) + "}";
}

inline std::string toString(const ABI42_0_0YGStyle::Edges &value) {
  static std::array<std::string, yoga::enums::count<ABI42_0_0YGEdge>()> names = {
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

  for (auto i = 0; i < yoga::enums::count<ABI42_0_0YGEdge>(); i++) {
    ABI42_0_0YGValue v = value[i];
    if (v.unit == ABI42_0_0YGUnitUndefined) {
      continue;
    }
    result += names[i] + ": " + toString(v) + separator;
  }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return "{" + result + "}";
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
