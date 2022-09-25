/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0ParagraphProps.h"

#include <ABI45_0_0React/ABI45_0_0renderer/attributedstring/conversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/attributedstring/primitives.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/propsConversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/debug/debugStringConvertibleUtils.h>

#include <glog/logging.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

ParagraphProps::ParagraphProps(
    const PropsParserContext &context,
    ParagraphProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(context, sourceProps, rawProps),
      BaseTextProps(context, sourceProps, rawProps),
      paragraphAttributes(convertRawProp(
          context,
          rawProps,
          sourceProps.paragraphAttributes,
          {})),
      isSelectable(convertRawProp(
          context,
          rawProps,
          "selectable",
          sourceProps.isSelectable,
          false)),
      onTextLayout(convertRawProp(
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

#pragma mark - DebugStringConvertible

#if ABI45_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphProps::getDebugProps() const {
  return ViewProps::getDebugProps() + BaseTextProps::getDebugProps() +
      paragraphAttributes.getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("isSelectable", isSelectable)};
}
#endif

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
