/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0core/LocalData.h>
#include <ABI31_0_0fabric/ABI31_0_0imagemanager/primitives.h>
#include <ABI31_0_0fabric/ABI31_0_0imagemanager/ImageRequest.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ImageLocalData;

using SharedImageLocalData = std::shared_ptr<const ImageLocalData>;

/*
 * LocalData for <Image> component.
 * Represents the image request state and (possible) retrieved image bitmap.
 */
class ImageLocalData:
  public LocalData {

public:

  ImageLocalData(const ImageSource &imageSource, ImageRequest imageRequest):
    imageSource_(imageSource),
    imageRequest_(std::move(imageRequest)) {};

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

  std::string getDebugName() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;

private:

  ImageSource imageSource_;
  ImageRequest imageRequest_;
};

} // namespace ReactABI31_0_0
} // namespace facebook
