/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0ParagraphProps.h"

#include <ABI41_0_0React/attributedstring/conversions.h>
#include <ABI41_0_0React/attributedstring/primitives.h>
#include <ABI41_0_0React/core/propsConversions.h>
#include <ABI41_0_0React/debug/debugStringConvertibleUtils.h>

#include <glog/logging.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

ParagraphProps::ParagraphProps(
    ParagraphProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps),
      BaseTextProps(sourceProps, rawProps),
      paragraphAttributes(
          convertRawProp(rawProps, sourceProps.paragraphAttributes, {})),
      isSelectable(convertRawProp(
          rawProps,
          "selectable",
          sourceProps.isSelectable,
          {})){};

#pragma mark - DebugStringConvertible

#if ABI41_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphProps::getDebugProps() const {
  return ViewProps::getDebugProps() + BaseTextProps::getDebugProps() +
      paragraphAttributes.getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("isSelectable", isSelectable)};
}
#endif

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
