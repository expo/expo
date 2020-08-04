/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0ImageLocalData.h"

#include <ABI37_0_0React/components/image/conversions.h>
#include <ABI37_0_0React/debug/debugStringConvertibleUtils.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

ImageSource ImageLocalData::getImageSource() const {
  return imageSource_;
}

const ImageRequest &ImageLocalData::getImageRequest() const {
  return imageRequest_;
}

#pragma mark - DebugStringConvertible

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE
std::string ImageLocalData::getDebugName() const {
  return "ImageLocalData";
}

SharedDebugStringConvertibleList ImageLocalData::getDebugProps() const {
  return {debugStringConvertibleItem("imageSource", imageSource_)};
}
#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
