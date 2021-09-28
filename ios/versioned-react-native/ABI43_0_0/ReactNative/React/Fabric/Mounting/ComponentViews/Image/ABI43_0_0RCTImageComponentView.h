/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTImageResponseDelegate.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for root <Image> component.
 */
@interface ABI43_0_0RCTImageComponentView : ABI43_0_0RCTViewComponentView <ABI43_0_0RCTImageResponseDelegate> {
 @protected
  UIImageView *_imageView;
}

@end

NS_ASSUME_NONNULL_END
