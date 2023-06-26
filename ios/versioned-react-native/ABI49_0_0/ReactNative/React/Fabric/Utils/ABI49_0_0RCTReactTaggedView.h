/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Lightweight wrapper class around a UIView with a ABI49_0_0React tag which registers a
 * constant ABI49_0_0React tag at initialization time for a stable hash and provides the
 * udnerlying view to a caller if that underlying view's ABI49_0_0React tag has not
 * changed from the one provided at initialization time (i.e. recycled).
 */
@interface ABI49_0_0RCTABI49_0_0ReactTaggedView : NSObject {
  UIView *_view;
  NSInteger _tag;
}

+ (ABI49_0_0RCTABI49_0_0ReactTaggedView *)wrap:(UIView *)view;

- (instancetype)initWithView:(UIView *)view;
- (nullable UIView *)view;
- (NSInteger)tag;

- (BOOL)isEqual:(id)other;
- (NSUInteger)hash;

@end

NS_ASSUME_NONNULL_END
