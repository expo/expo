/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0ImageLocalData.h"

#include <ABI31_0_0fabric/ABI31_0_0components/image/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace ReactABI31_0_0 {

ImageSource ImageLocalData::getImageSource() const {
  return imageSource_;
}

const ImageRequest &ImageLocalData::getImageRequest() const {
  return imageRequest_;
}

#pragma mark - DebugStringConvertible

std::string ImageLocalData::getDebugName() const {
  return "ImageLocalData";
}

SharedDebugStringConvertibleList ImageLocalData::getDebugProps() const {
  return {
    debugStringConvertibleItem("imageSource", imageSource_)
  };
}

} // namespace ReactABI31_0_0
} // namespace facebook
