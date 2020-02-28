/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTImageResponseObserverProxy.h"

#import <ABI37_0_0React/imagemanager/ImageResponse.h>
#import <ABI37_0_0React/imagemanager/ImageResponseObserver.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

ABI37_0_0RCTImageResponseObserverProxy::ABI37_0_0RCTImageResponseObserverProxy(void *delegate)
    : delegate_((__bridge id<ABI37_0_0RCTImageResponseDelegate>)delegate)
{
}

void ABI37_0_0RCTImageResponseObserverProxy::didReceiveImage(const ImageResponse &imageResponse)
{
  UIImage *image = (__bridge UIImage *)imageResponse.getImage().get();
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveImage:image fromObserver:this_];
  });
}

void ABI37_0_0RCTImageResponseObserverProxy::didReceiveProgress(float p)
{
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveProgress:p fromObserver:this_];
  });
}

void ABI37_0_0RCTImageResponseObserverProxy::didReceiveFailure()
{
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveFailureFromObserver:this_];
  });
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
