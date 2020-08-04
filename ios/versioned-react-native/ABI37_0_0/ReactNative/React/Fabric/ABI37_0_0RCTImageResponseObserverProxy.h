/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "ABI37_0_0RCTImageResponseDelegate.h"

#include <ABI37_0_0React/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {
class ABI37_0_0RCTImageResponseObserverProxy : public ImageResponseObserver {
 public:
  ABI37_0_0RCTImageResponseObserverProxy(void *delegate);
  void didReceiveImage(const ImageResponse &imageResponse) override;
  void didReceiveProgress(float p) override;
  void didReceiveFailure() override;

 private:
  __weak id<ABI37_0_0RCTImageResponseDelegate> delegate_;
};
} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook

NS_ASSUME_NONNULL_END
