/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTImageInstrumentationProxy.h"

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

ABI39_0_0RCTImageInstrumentationProxy::ABI39_0_0RCTImageInstrumentationProxy(id<ABI39_0_0RCTImageLoaderWithAttributionProtocol> imageLoader)
    : imageLoader_(imageLoader)
{
}

ABI39_0_0RCTImageInstrumentationProxy::~ABI39_0_0RCTImageInstrumentationProxy()
{
  if (!imageURLLoaderRequest_) {
    return;
  }
  [imageLoader_ trackURLImageDidDestroy:imageURLLoaderRequest_];
}

void ABI39_0_0RCTImageInstrumentationProxy::didSetImage() const
{
  if (!ABI39_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  if (!imageURLLoaderRequest_) {
    return;
  }

  [imageLoader_ trackURLImageContentDidSetForRequest:imageURLLoaderRequest_];
}

void ABI39_0_0RCTImageInstrumentationProxy::didEnterVisibilityRange() const
{
  if (!ABI39_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
  if (!imageURLLoaderRequest_) {
    return;
  }
}

void ABI39_0_0RCTImageInstrumentationProxy::didExitVisibilityRange() const
{
  if (!ABI39_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  // TODO (T58941612): Not yet supported.
  if (!imageURLLoaderRequest_) {
    return;
  }
}

void ABI39_0_0RCTImageInstrumentationProxy::trackNativeImageView(UIView *imageView) const
{
  if (!ABI39_0_0RCTImageLoadingPerfInstrumentationEnabled()) {
    return;
  }

  if (!imageURLLoaderRequest_) {
    return;
  }
  [imageLoader_ trackURLImageVisibilityForRequest:imageURLLoaderRequest_ imageView:imageView];
}

void ABI39_0_0RCTImageInstrumentationProxy::setImageURLLoaderRequest(ABI39_0_0RCTImageURLLoaderRequest *request)
{
  imageURLLoaderRequest_ = request;
}

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook
