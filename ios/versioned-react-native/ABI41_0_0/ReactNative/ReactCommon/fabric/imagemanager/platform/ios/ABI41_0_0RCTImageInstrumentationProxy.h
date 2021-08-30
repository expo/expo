/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/ABI41_0_0RCTImageLoaderWithAttributionProtocol.h>

#include <ABI41_0_0React/core/ABI41_0_0ReactPrimitives.h>
#include <ABI41_0_0React/imagemanager/ImageInstrumentation.h>

NS_ASSUME_NONNULL_BEGIN

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class ABI41_0_0RCTImageInstrumentationProxy final : public ImageInstrumentation {
 public:
  ABI41_0_0RCTImageInstrumentationProxy(id<ABI41_0_0RCTImageLoaderWithAttributionProtocol> imageLoader);
  ~ABI41_0_0RCTImageInstrumentationProxy();

  void didSetImage() const override;
  void didEnterVisibilityRange() const override;
  void didExitVisibilityRange() const override;

  void trackNativeImageView(UIView *imageView) const;
  void setImageURLLoaderRequest(ABI41_0_0RCTImageURLLoaderRequest *request);

 private:
  __weak id<ABI41_0_0RCTImageLoaderWithAttributionProtocol> imageLoader_;
  ABI41_0_0RCTImageURLLoaderRequest *imageURLLoaderRequest_;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook

NS_ASSUME_NONNULL_END
