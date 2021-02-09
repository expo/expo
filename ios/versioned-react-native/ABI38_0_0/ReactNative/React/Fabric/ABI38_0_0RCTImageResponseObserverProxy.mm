/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTImageResponseObserverProxy.h"

#import <ABI38_0_0React/imagemanager/ImageResponse.h>
#import <ABI38_0_0React/imagemanager/ImageResponseObserver.h>
#import <ABI38_0_0React/utils/ManagedObjectWrapper.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

ABI38_0_0RCTImageResponseObserverProxy::ABI38_0_0RCTImageResponseObserverProxy(id<ABI38_0_0RCTImageResponseDelegate> delegate)
    : delegate_(delegate)
{
}

void ABI38_0_0RCTImageResponseObserverProxy::didReceiveImage(ImageResponse const &imageResponse) const
{
  UIImage *image = (UIImage *)unwrapManagedObject(imageResponse.getImage());
  id<ABI38_0_0RCTImageResponseDelegate> delegate = delegate_;
  auto this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveImage:image fromObserver:this_];
  });
}

void ABI38_0_0RCTImageResponseObserverProxy::didReceiveProgress(float progress) const
{
  auto this_ = this;
  id<ABI38_0_0RCTImageResponseDelegate> delegate = delegate_;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveProgress:progress fromObserver:this_];
  });
}

void ABI38_0_0RCTImageResponseObserverProxy::didReceiveFailure() const
{
  auto this_ = this;
  id<ABI38_0_0RCTImageResponseDelegate> delegate = delegate_;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate didReceiveFailureFromObserver:this_];
  });
}

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
