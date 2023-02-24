/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0YogaStylableProps.h"

#include <ABI47_0_0React/ABI47_0_0renderer/components/view/conversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/view/propsConversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/propsConversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/debugStringConvertibleUtils.h>
#include <ABI47_0_0yoga/ABI47_0_0YGNode.h>
#include <ABI47_0_0yoga/ABI47_0_0Yoga.h>

#include "ABI47_0_0conversions.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

YogaStylableProps::YogaStylableProps(
    const PropsParserContext &context,
    YogaStylableProps const &sourceProps,
    RawProps const &rawProps,
    bool shouldSetRawProps)
    : Props(context, sourceProps, rawProps, shouldSetRawProps),
      yogaStyle(
          Props::enablePropIteratorSetter
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

#define REBUILD_FIELD_SWITCH_CASE(field) \
  REBUILD_FIELD_SWITCH_CASE2(field, #field)

#define REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, index, fieldName) \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                     \
    yogaStyle.field()[index] =                                        \
        getFieldValue(context, value, defaults.field()[index]);       \
    return;                                                           \
  }

#define REBUILD_FIELD_ABI47_0_0YG_DIMENSION(field, widthStr, heightStr)             \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI47_0_0YGDimensionWidth, widthStr); \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI47_0_0YGDimensionHeight, heightStr);

#define REBUILD_FIELD_ABI47_0_0YG_EDGES(field, prefix, suffix)                          \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI47_0_0YGEdgeLeft, prefix "Left" suffix);                                \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI47_0_0YGEdgeTop, prefix "Top" suffix); \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI47_0_0YGEdgeRight, prefix "Right" suffix);                              \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI47_0_0YGEdgeBottom, prefix "Bottom" suffix);                            \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI47_0_0YGEdgeStart, prefix "Start" suffix);                              \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI47_0_0YGEdgeEnd, prefix "End" suffix); \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI47_0_0YGEdgeHorizontal, prefix "Horizontal" suffix);                    \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(                                        \
      field, ABI47_0_0YGEdgeVertical, prefix "Vertical" suffix);                        \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(field, ABI47_0_0YGEdgeAll, prefix "" suffix);

#define REBUILD_FIELD_ABI47_0_0YG_EDGES_POSITION()                                 \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI47_0_0YGEdgeLeft, "left");     \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI47_0_0YGEdgeTop, "top");       \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI47_0_0YGEdgeRight, "right");   \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI47_0_0YGEdgeBottom, "bottom"); \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI47_0_0YGEdgeStart, "start");   \
  REBUILD_ABI47_0_0YG_FIELD_SWITCH_CASE_INDEXED(position, ABI47_0_0YGEdgeEnd, "end");

void YogaStylableProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  static const auto defaults = ABI47_0_0YGStyle{};

  Props::setProp(context, hash, propName, value);

  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE(direction);
    REBUILD_FIELD_SWITCH_CASE(flexDirection);
    REBUILD_FIELD_SWITCH_CASE(justifyContent);
    REBUILD_FIELD_SWITCH_CASE(alignContent);
    REBUILD_FIELD_SWITCH_CASE(alignItems);
    REBUILD_FIELD_SWITCH_CASE(alignSelf);
    REBUILD_FIELD_SWITCH_CASE(flexWrap);
    REBUILD_FIELD_SWITCH_CASE(overflow);
    REBUILD_FIELD_SWITCH_CASE(display);
    REBUILD_FIELD_SWITCH_CASE(flex);
    REBUILD_FIELD_SWITCH_CASE(flexGrow);
    REBUILD_FIELD_SWITCH_CASE(flexShrink);
    REBUILD_FIELD_SWITCH_CASE(flexBasis);
    REBUILD_FIELD_SWITCH_CASE2(positionType, "position");
    REBUILD_FIELD_SWITCH_CASE(aspectRatio);
    REBUILD_FIELD_ABI47_0_0YG_DIMENSION(dimensions, "width", "height");
    REBUILD_FIELD_ABI47_0_0YG_DIMENSION(minDimensions, "minWidth", "minHeight");
    REBUILD_FIELD_ABI47_0_0YG_DIMENSION(maxDimensions, "maxWidth", "maxHeight");
    REBUILD_FIELD_ABI47_0_0YG_EDGES_POSITION();
    REBUILD_FIELD_ABI47_0_0YG_EDGES(margin, "margin", "");
    REBUILD_FIELD_ABI47_0_0YG_EDGES(padding, "padding", "");
    REBUILD_FIELD_ABI47_0_0YG_EDGES(border, "border", "Width");
  }
}

#pragma mark - DebugStringConvertible

#if ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  auto const defaultYogaStyle = ABI47_0_0YGStyle{};
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

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
