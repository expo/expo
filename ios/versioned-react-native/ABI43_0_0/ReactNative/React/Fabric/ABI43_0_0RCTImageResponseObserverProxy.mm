/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTImageResponseObserverProxy.h"

#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>
#import <ABI43_0_0React/ABI43_0_0renderer/imagemanager/ImageResponse.h>
#import <ABI43_0_0React/ABI43_0_0renderer/imagemanager/ImageResponseObserver.h>
#import <ABI43_0_0React/ABI43_0_0utils/ManagedObjectWrapper.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

ABI43_0_0RCTImageResponseObserverProxy::ABI43_0_0RCTImageResponseObserverProxy(id<ABI43_0_0RCTImageResponseDelegate> delegate)
    : delegate_(delegate)
{
}

void ABI43_0_0RCTImageResponseObserverProxy::didReceiveImage(ImageResponse const &imageResponse) const
{
  UIImage *image = (UIImage *)unwrapManagedObject(imageResponse.getImage());
  id metadata = unwrapManagedObject(imageResponse.getMetadata());
  id<ABI43_0_0RCTImageResponseDelegate> delegate = delegate_;
  auto this_ = this;
  ABI43_0_0RCTExecuteOnMainQueue(^{
    [delegate didReceiveImage:image metadata:metadata fromObserver:this_];
  });
}

void ABI43_0_0RCTImageResponseObserverProxy::didReceiveProgress(float progress) const
{
  auto this_ = this;
  id<ABI43_0_0RCTImageResponseDelegate> delegate = delegate_;
  ABI43_0_0RCTExecuteOnMainQueue(^{
    [delegate didReceiveProgress:progress fromObserver:this_];
  });
}

void ABI43_0_0RCTImageResponseObserverProxy::didReceiveFailure() const
{
  auto this_ = this;
  id<ABI43_0_0RCTImageResponseDelegate> delegate = delegate_;
  ABI43_0_0RCTExecuteOnMainQueue(^{
    [delegate didReceiveFailureFromObserver:this_];
  });
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
