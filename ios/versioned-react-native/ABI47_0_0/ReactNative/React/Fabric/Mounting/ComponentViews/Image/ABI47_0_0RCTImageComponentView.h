/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTImageResponseDelegate.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIImageViewAnimated.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for root <Image> component.
 */
@interface ABI47_0_0RCTImageComponentView : ABI47_0_0RCTViewComponentView <ABI47_0_0RCTImageResponseDelegate> {
 @protected
  ABI47_0_0RCTUIImageViewAnimated *_imageView;
}

@end

NS_ASSUME_NONNULL_END
