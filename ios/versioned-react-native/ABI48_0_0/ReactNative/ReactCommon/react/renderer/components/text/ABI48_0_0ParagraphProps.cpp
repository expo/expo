/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0ParagraphProps.h"

#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/conversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/primitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/CoreFeatures.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/propsConversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/debug/debugStringConvertibleUtils.h>

#include <glog/logging.h>

namespace ABI48_0_0facebook::ABI48_0_0React {

ParagraphProps::ParagraphProps(
    const PropsParserContext &context,
    ParagraphProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(context, sourceProps, rawProps),
      BaseTextProps(context, sourceProps, rawProps),
      paragraphAttributes(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.paragraphAttributes
              : convertRawProp(
                    context,
                    rawProps,
                    sourceProps.paragraphAttributes,
                    {})),
      isSelectable(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.isSelectable
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "selectable",
                                                       sourceProps.isSelectable,
                                                       false)),
      onTextLayout(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.onTextLayout
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "onTextLayout",
                                                       sourceProps.onTextLayout,
                                                       {})) {
  /*
   * These props are applied to `View`, therefore they must not be a part of
   * base text attributes.
   */
  textAttributes.opacity = std::numeric_limits<Float>::quiet_NaN();
  textAttributes.backgroundColor = {};
};

void ParagraphProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  ViewProps::setProp(context, hash, propName, value);
  BaseTextProps::setProp(context, hash, propName, value);

  // ParagraphAttributes has its own switch statement - to keep all
  // of these fields together, and because there are some collisions between
  // propnames parsed here and outside of ParagraphAttributes.
  // This code is also duplicated in AndroidTextInput.
  static auto paDefaults = ParagraphAttributes{};
  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        maximumNumberOfLines,
        "numberOfLines");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults, value, paragraphAttributes, ellipsizeMode, "ellipsizeMode");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        textBreakStrategy,
        "textBreakStrategy");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        adjustsFontSizeToFit,
        "adjustsFontSizeToFit");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        minimumFontSize,
        "minimumFontSize");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        maximumFontSize,
        "maximumFontSize");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        includeFontPadding,
        "includeFontPadding");
    REBUILD_FIELD_SWITCH_CASE(
        paDefaults,
        value,
        paragraphAttributes,
        android_hyphenationFrequency,
        "android_hyphenationFrequency");
  }

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(isSelectable, false);
    RAW_SET_PROP_SWITCH_CASE_BASIC(onTextLayout, {});
  }

  /*
   * These props are applied to `View`, therefore they must not be a part of
   * base text attributes.
   */
  textAttributes.opacity = std::numeric_limits<Float>::quiet_NaN();
  textAttributes.backgroundColor = {};
}

#pragma mark - DebugStringConvertible

#if ABI48_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphProps::getDebugProps() const {
  return ViewProps::getDebugProps() + BaseTextProps::getDebugProps() +
      paragraphAttributes.getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("isSelectable", isSelectable)};
}
#endif

} // namespace ABI48_0_0facebook::ABI48_0_0React
