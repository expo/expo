/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTImageResponseObserverProxy.h"

#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageResponse.h>
#import <ABI49_0_0React/renderer/imagemanager/ABI49_0_0ImageResponseObserver.h>
#import <ABI49_0_0React/utils/ABI49_0_0ManagedObjectWrapper.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

ABI49_0_0RCTImageResponseObserverProxy::ABI49_0_0RCTImageResponseObserverProxy(id<ABI49_0_0RCTImageResponseDelegate> delegate)
    : delegate_(delegate)
{
}

void ABI49_0_0RCTImageResponseObserverProxy::didReceiveImage(ImageResponse const &imageResponse) const
{
  UIImage *image = (UIImage *)unwrapManagedObject(imageResponse.getImage());
  id metadata = unwrapManagedObject(imageResponse.getMetadata());
  id<ABI49_0_0RCTImageResponseDelegate> delegate = delegate_;
  auto this_ = this;
  ABI49_0_0RCTExecuteOnMainQueue(^{
    [delegate didReceiveImage:image metadata:metadata fromObserver:this_];
  });
}

void ABI49_0_0RCTImageResponseObserverProxy::didReceiveProgress(float progress) const
{
  auto this_ = this;
  id<ABI49_0_0RCTImageResponseDelegate> delegate = delegate_;
  ABI49_0_0RCTExecuteOnMainQueue(^{
    [delegate didReceiveProgress:progress fromObserver:this_];
  });
}

void ABI49_0_0RCTImageResponseObserverProxy::didReceiveFailure() const
{
  auto this_ = this;
  id<ABI49_0_0RCTImageResponseDelegate> delegate = delegate_;
  ABI49_0_0RCTExecuteOnMainQueue(^{
    [delegate didReceiveFailureFromObserver:this_];
  });
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
