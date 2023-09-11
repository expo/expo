/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol ABI47_0_0RCTAnimatedImage <NSObject>
@property (nonatomic, assign, readonly) NSUInteger animatedImageFrameCount;
@property (nonatomic, assign, readonly) NSUInteger animatedImageLoopCount;

- (nullable UIImage *)animatedImageFrameAtIndex:(NSUInteger)index;
- (NSTimeInterval)animatedImageDurationAtIndex:(NSUInteger)index;

@end

@interface ABI47_0_0RCTAnimatedImage : UIImage <ABI47_0_0RCTAnimatedImage>

@end
