/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "ABI34_0_0RCTImageResponseDelegate.h"
#import "ABI34_0_0RCTImageResponseDelegate.h"

#include <ReactABI34_0_0/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook {
  namespace ReactABI34_0_0 {
    class ABI34_0_0RCTImageResponseObserverProxy: public ImageResponseObserver {
    public:
      ABI34_0_0RCTImageResponseObserverProxy(void* delegate);
      void didReceiveImage(const ImageResponse &imageResponse) override;
      void didReceiveProgress (float p) override;
      void didReceiveFailure() override;
      
    private:
      id<ABI34_0_0RCTImageResponseDelegate> delegate_;
    };
  }
}

NS_ASSUME_NONNULL_END
