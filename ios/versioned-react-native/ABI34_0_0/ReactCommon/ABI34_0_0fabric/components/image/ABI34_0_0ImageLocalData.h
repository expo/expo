/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI34_0_0/core/LocalData.h>
#include <ReactABI34_0_0/imagemanager/ImageRequest.h>
#include <ReactABI34_0_0/imagemanager/primitives.h>

namespace facebook {
namespace ReactABI34_0_0 {

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

#if RN_DEBUG_STRING_CONVERTIBLE
  std::string getDebugName() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

 private:
  ImageSource imageSource_;
  ImageRequest imageRequest_;
};

} // namespace ReactABI34_0_0
} // namespace facebook
