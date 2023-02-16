/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0YogaStylableProps.h"

#include <ABI48_0_0React/ABI48_0_0renderer/components/view/conversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/propsConversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/CoreFeatures.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/propsConversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/debug/debugStringConvertibleUtils.h>
#include <ABI48_0_0yoga/ABI48_0_0YGNode.h>
#include <ABI48_0_0yoga/ABI48_0_0Yoga.h>

#include "ABI48_0_0conversions.h"

namespace ABI48_0_0facebook::ABI48_0_0React {

YogaStylableProps::YogaStylableProps(
    const PropsParserContext &context,
    YogaStylableProps const &sourceProps,
    RawProps const &rawProps,
    bool shouldSetRawProps)
    : Props(context, sourceProps, rawProps, shouldSetRawProps),
      yogaStyle(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.yogaStyle
              : convertRawProp(context, rawProps, sourceProps.yogaStyle)){};

template <typename T>
static inline T const getFieldValue(
    const PropsParserContext &context,
    RawValue const &value,
    T const defaultValue) {
  if (value.hasValue()) {
    T res;
    fromRawValue(context, value, res);
    return res;
  }

  return defaultValue;
}

#define REBUILD_FIELD_SWITCH_CASE2(field, fieldName)                     \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                        \
    yogaStyle.field() = getFieldValue(context, value, defaults.field()); \
    return;                                                              \
  }

// @lint-ignore CLANGTIDY cppcoreguidelines-macro-usage
#define REBUILD_FIELD_SWITCH_CASE_YSP(field) \
  REBUILD_FIELD_SWITCH_CASE2(field, #field)

#define REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, index, fieldName) \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                     \
    yogaStyle.field()[index] =                                        \
        getFieldValue(context, value, defaults.field()[index]);       \
    return;                                                           \
  }

#define REBUILD_FIELD_ABI48_0_0YG_DIMENSION(field, widthStr, heightStr)             \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGDimensionWidth, widthStr); \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGDimensionHeight, heightStr);

#define REBUILD_FIELD_ABI48_0_0YG_GUTTER(field, rowGapStr, columnGapStr, gapStr)      \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGGutterRow, rowGapStr);       \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGGutterColumn, columnGapStr); \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGGutterAll, gapStr);

#define REBUILD_FIELD_ABI48_0_0YG_EDGES(field, prefix, suffix)                          \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI48_0_0YGEdgeLeft, prefix "Left" suffix);                                \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGEdgeTop, prefix "Top" suffix); \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI48_0_0YGEdgeRight, prefix "Right" suffix);                              \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI48_0_0YGEdgeBottom, prefix "Bottom" suffix);                            \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI48_0_0YGEdgeStart, prefix "Start" suffix);                              \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGEdgeEnd, prefix "End" suffix); \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI48_0_0YGEdgeHorizontal, prefix "Horizontal" suffix);                    \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI48_0_0YGEdgeVertical, prefix "Vertical" suffix);                        \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI48_0_0YGEdgeAll, prefix "" suffix);

#define REBUILD_FIELD_ABI48_0_0YG_EDGES_POSITION()                                 \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI48_0_0YGEdgeLeft, "left");     \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI48_0_0YGEdgeTop, "top");       \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI48_0_0YGEdgeRight, "right");   \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI48_0_0YGEdgeBottom, "bottom"); \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI48_0_0YGEdgeStart, "start");   \
  REBUILD_ABI48_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI48_0_0YGEdgeEnd, "end");

void YogaStylableProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  static const auto defaults = ABI48_0_0YGStyle{};

  Props::setProp(context, hash, propName, value);

  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE_YSP(direction);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexDirection);
    REBUILD_FIELD_SWITCH_CASE_YSP(justifyContent);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignContent);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignItems);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignSelf);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexWrap);
    REBUILD_FIELD_SWITCH_CASE_YSP(overflow);
    REBUILD_FIELD_SWITCH_CASE_YSP(display);
    REBUILD_FIELD_SWITCH_CASE_YSP(flex);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexGrow);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexShrink);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexBasis);
    REBUILD_FIELD_SWITCH_CASE2(positionType, "position");
    REBUILD_FIELD_ABI48_0_0YG_GUTTER(gap, "rowGap", "columnGap", "gap");
    REBUILD_FIELD_SWITCH_CASE_YSP(aspectRatio);
    REBUILD_FIELD_ABI48_0_0YG_DIMENSION(dimensions, "width", "height");
    REBUILD_FIELD_ABI48_0_0YG_DIMENSION(minDimensions, "minWidth", "minHeight");
    REBUILD_FIELD_ABI48_0_0YG_DIMENSION(maxDimensions, "maxWidth", "maxHeight");
    REBUILD_FIELD_ABI48_0_0YG_EDGES_POSITION();
    REBUILD_FIELD_ABI48_0_0YG_EDGES(margin, "margin", "");
    REBUILD_FIELD_ABI48_0_0YG_EDGES(padding, "padding", "");
    REBUILD_FIELD_ABI48_0_0YG_EDGES(border, "border", "Width");
  }
}

#pragma mark - DebugStringConvertible

#if ABI48_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  auto const defaultYogaStyle = ABI48_0_0YGStyle{};
  return {
      debugStringConvertibleItem(
          "direction", yogaStyle.direction(), defaultYogaStyle.direction()),
      debugStringConvertibleItem(
          "flexDirection",
          yogaStyle.flexDirection(),
          defaultYogaStyle.flexDirection()),
      debugStringConvertibleItem(
          "justifyContent",
          yogaStyle.justifyContent(),
          defaultYogaStyle.justifyContent()),
      debugStringConvertibleItem(
          "alignContent",
          yogaStyle.alignContent(),
          defaultYogaStyle.alignContent()),
      debugStringConvertibleItem(
          "alignItems", yogaStyle.alignItems(), defaultYogaStyle.alignItems()),
      debugStringConvertibleItem(
          "alignSelf", yogaStyle.alignSelf(), defaultYogaStyle.alignSelf()),
      debugStringConvertibleItem(
          "positionType",
          yogaStyle.positionType(),
          defaultYogaStyle.positionType()),
      debugStringConvertibleItem(
          "flexWrap", yogaStyle.flexWrap(), defaultYogaStyle.flexWrap()),
      debugStringConvertibleItem(
          "overflow", yogaStyle.overflow(), defaultYogaStyle.overflow()),
      debugStringConvertibleItem(
          "display", yogaStyle.display(), defaultYogaStyle.display()),
      debugStringConvertibleItem(
          "flex", yogaStyle.flex(), defaultYogaStyle.flex()),
      debugStringConvertibleItem(
          "flexGrow", yogaStyle.flexGrow(), defaultYogaStyle.flexGrow()),
      debugStringConvertibleItem(
          "rowGap",
          yogaStyle.gap()[ABI48_0_0YGGutterRow],
          defaultYogaStyle.gap()[ABI48_0_0YGGutterRow]),
      debugStringConvertibleItem(
          "columnGap",
          yogaStyle.gap()[ABI48_0_0YGGutterColumn],
          defaultYogaStyle.gap()[ABI48_0_0YGGutterColumn]),
      debugStringConvertibleItem(
          "gap",
          yogaStyle.gap()[ABI48_0_0YGGutterAll],
          defaultYogaStyle.gap()[ABI48_0_0YGGutterAll]),
      debugStringConvertibleItem(
          "flexShrink", yogaStyle.flexShrink(), defaultYogaStyle.flexShrink()),
      debugStringConvertibleItem(
          "flexBasis", yogaStyle.flexBasis(), defaultYogaStyle.flexBasis()),
      debugStringConvertibleItem(
          "margin", yogaStyle.margin(), defaultYogaStyle.margin()),
      debugStringConvertibleItem(
          "position", yogaStyle.position(), defaultYogaStyle.position()),
      debugStringConvertibleItem(
          "padding", yogaStyle.padding(), defaultYogaStyle.padding()),
      debugStringConvertibleItem(
          "border", yogaStyle.border(), defaultYogaStyle.border()),
      debugStringConvertibleItem(
          "dimensions", yogaStyle.dimensions(), defaultYogaStyle.dimensions()),
      debugStringConvertibleItem(
          "minDimensions",
          yogaStyle.minDimensions(),
          defaultYogaStyle.minDimensions()),
      debugStringConvertibleItem(
          "maxDimensions",
          yogaStyle.maxDimensions(),
          defaultYogaStyle.maxDimensions()),
      debugStringConvertibleItem(
          "aspectRatio",
          yogaStyle.aspectRatio(),
          defaultYogaStyle.aspectRatio()),
  };
}
#endif

} // namespace ABI48_0_0facebook::ABI48_0_0React
