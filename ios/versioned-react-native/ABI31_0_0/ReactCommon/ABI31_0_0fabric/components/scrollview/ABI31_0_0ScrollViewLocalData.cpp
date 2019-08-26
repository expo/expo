/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0ScrollViewLocalData.h"

#include <ABI31_0_0fabric/ABI31_0_0debug/debugStringConvertibleUtils.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/conversions.h>

namespace facebook {
namespace ReactABI31_0_0 {

ScrollViewLocalData::ScrollViewLocalData(Rect contentBoundingRect):
  contentBoundingRect(contentBoundingRect) {}

Size ScrollViewLocalData::getContentSize() const {
  return Size {contentBoundingRect.getMaxX(), contentBoundingRect.getMaxY()};
}

#pragma mark - DebugStringConvertible

std::string ScrollViewLocalData::getDebugName() const {
  return "ScrollViewLocalData";
}

SharedDebugStringConvertibleList ScrollViewLocalData::getDebugProps() const {
  return {
    debugStringConvertibleItem("contentBoundingRect", contentBoundingRect)
  };
}

} // namespace ReactABI31_0_0
} // namespace facebook
