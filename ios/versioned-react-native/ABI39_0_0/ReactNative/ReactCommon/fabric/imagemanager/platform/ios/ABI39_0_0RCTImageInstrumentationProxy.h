/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI39_0_0React/ABI39_0_0RCTImageLoaderWithAttributionProtocol.h>

#include <ABI39_0_0React/core/ABI39_0_0ReactPrimitives.h>
#include <ABI39_0_0React/imagemanager/ImageInstrumentation.h>

NS_ASSUME_NONNULL_BEGIN

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

class ABI39_0_0RCTImageInstrumentationProxy final : public ImageInstrumentation {
 public:
  ABI39_0_0RCTImageInstrumentationProxy(id<ABI39_0_0RCTImageLoaderWithAttributionProtocol> imageLoader);
  ~ABI39_0_0RCTImageInstrumentationProxy();

  void didSetImage() const override;
  void didEnterVisibilityRange() const override;
  void didExitVisibilityRange() const override;

  void trackNativeImageView(UIView *imageView) const;
  void setImageURLLoaderRequest(ABI39_0_0RCTImageURLLoaderRequest *request);

 private:
  __weak id<ABI39_0_0RCTImageLoaderWithAttributionProtocol> imageLoader_;
  ABI39_0_0RCTImageURLLoaderRequest *imageURLLoaderRequest_;
};

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook

NS_ASSUME_NONNULL_END
