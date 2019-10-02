/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTImageResponseObserverProxy.h"

#import <ReactABI33_0_0/imagemanager/ImageResponseObserver.h>
#import <ReactABI33_0_0/imagemanager/ImageResponse.h>

namespace facebook {
  namespace ReactABI33_0_0 {
    
ABI33_0_0RCTImageResponseObserverProxy::ABI33_0_0RCTImageResponseObserverProxy(void* delegate): delegate_((__bridge id<ABI33_0_0RCTImageResponseDelegate>)delegate) {}
    
void ABI33_0_0RCTImageResponseObserverProxy::didReceiveImage(const ImageResponse &imageResponse) {
  UIImage *image = (__bridge UIImage *)imageResponse.getImage().get();
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveImage:image fromObserver:this_];
  });
}

void ABI33_0_0RCTImageResponseObserverProxy::didReceiveProgress (float p) {
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveProgress:p fromObserver:this_];
  });
}
    
void ABI33_0_0RCTImageResponseObserverProxy::didReceiveFailure() {
  void *this_ = this;
  dispatch_async(dispatch_get_main_queue(), ^{
    [delegate_ didReceiveFailureFromObserver:this_];
  });
}

  } // namespace ReactABI33_0_0
} // namespace facebook
