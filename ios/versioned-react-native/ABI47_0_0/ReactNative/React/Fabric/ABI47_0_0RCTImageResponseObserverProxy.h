/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "ABI47_0_0RCTImageResponseDelegate.h"

#include <ABI47_0_0React/ABI47_0_0renderer/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class ABI47_0_0RCTImageResponseObserverProxy final : public ImageResponseObserver {
 public:
  ABI47_0_0RCTImageResponseObserverProxy(id<ABI47_0_0RCTImageResponseDelegate> delegate = nil);

  void didReceiveImage(ImageResponse const &imageResponse) const override;
  void didReceiveProgress(float progress) const override;
  void didReceiveFailure() const override;

 private:
  __weak id<ABI47_0_0RCTImageResponseDelegate> delegate_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook

NS_ASSUME_NONNULL_END
