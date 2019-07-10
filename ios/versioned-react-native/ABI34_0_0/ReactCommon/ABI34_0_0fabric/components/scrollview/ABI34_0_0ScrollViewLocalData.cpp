/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0ScrollViewLocalData.h"

#include <ReactABI34_0_0/debug/debugStringConvertibleUtils.h>
#include <ReactABI34_0_0/graphics/conversions.h>

namespace facebook {
namespace ReactABI34_0_0 {

ScrollViewLocalData::ScrollViewLocalData(Rect contentBoundingRect)
    : contentBoundingRect(contentBoundingRect) {}

Size ScrollViewLocalData::getContentSize() const {
  return Size{contentBoundingRect.getMaxX(), contentBoundingRect.getMaxY()};
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ScrollViewLocalData::getDebugName() const {
  return "ScrollViewLocalData";
}

SharedDebugStringConvertibleList ScrollViewLocalData::getDebugProps() const {
  return {
      debugStringConvertibleItem("contentBoundingRect", contentBoundingRect)};
}
#endif

} // namespace ReactABI34_0_0
} // namespace facebook
