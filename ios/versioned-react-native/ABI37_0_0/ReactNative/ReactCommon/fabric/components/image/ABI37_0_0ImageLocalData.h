/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/core/LocalData.h>
#include <ABI37_0_0React/imagemanager/ImageRequest.h>
#include <ABI37_0_0React/imagemanager/primitives.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class ImageLocalData;

using SharedImageLocalData = std::shared_ptr<const ImageLocalData>;

/*
 * LocalData for <Image> component.
 * Represents the image request state and (possible) retrieved image bitmap.
 */
class ImageLocalData : public LocalData {
 public:
  ImageLocalData(const ImageSource &imageSource, ImageRequest imageRequest)
      : imageSource_(imageSource), imageRequest_(std::move(imageRequest)){};

  /*
   * Returns stored ImageSource object.
   */
  ImageSource getImageSource() const;

  /*
   * Exposes for reading stored `ImageRequest` object.
   * `ImageRequest` object cannot be copied or moved from `ImageLocalData`.
   */
  const ImageRequest &getImageRequest() const;

#pragma mark - DebugStringConvertible

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE
  std::string getDebugName() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

 private:
  ImageSource imageSource_;
  ImageRequest imageRequest_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
