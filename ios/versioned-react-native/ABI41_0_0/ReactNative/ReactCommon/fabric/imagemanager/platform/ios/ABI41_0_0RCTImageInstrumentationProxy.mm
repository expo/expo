/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTImageInstrumentationProxy.h"

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

ABI41_0_0RCTImageInstrumentationProxy::ABI41_0_0RCTImageInstrumentationProxy(id<ABI41_0_0RCTImageLoaderWithAttributionProtocol> imageLoader)
    : imageLoader_(imageLoader)
{
}

ABI41_0_0RCTImageInstrumentationProxy::~ABI41_0_0RCTImageInstrumentationProxy()
{
  if (!imageURLLoaderRequest_) {
    return;
  }
  [imageLoader_ trackURLImageDidDestroy:imageURLLoaderRequest_];
}

void ABI41_0_0RCTImageInstrumentationProxy::didSetImage() const
{
  if (!ABI41_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  if (!imageURLLoaderRequest_) {
    return;
  }

  [imageLoader_ trackURLImageContentDidSetForRequest:imageURLLoaderRequest_];
}

void ABI41_0_0RCTImageInstrumentationProxy::didEnterVisibilityRange() const
{
  if (!ABI41_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
  if (!imageURLLoaderRequest_) {
    return;
  }
}

void ABI41_0_0RCTImageInstrumentationProxy::didExitVisibilityRange() const
{
  if (!ABI41_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
  if (!imageURLLoaderRequest_) {
    return;
  }
}

void ABI41_0_0RCTImageInstrumentationProxy::trackNativeImageView(UIView *imageView) const
{
  if (!ABI41_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  if (!imageURLLoaderRequest_) {
    return;
  }
  [imageLoader_ trackURLImageVisibilityForRequest:imageURLLoaderRequest_ imageView:imageView];
}

void ABI41_0_0RCTImageInstrumentationProxy::setImageURLLoaderRequest(ABI41_0_0RCTImageURLLoaderRequest *request)
{
  imageURLLoaderRequest_ = request;
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
