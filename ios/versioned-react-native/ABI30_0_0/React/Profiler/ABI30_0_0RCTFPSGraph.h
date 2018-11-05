/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTDefines.h>

#if ABI30_0_0RCT_DEV

@interface ABI30_0_0RCTFPSGraph : UIView

@property (nonatomic, assign, readonly) NSUInteger FPS;
@property (nonatomic, assign, readonly) NSUInteger maxFPS;
@property (nonatomic, assign, readonly) NSUInteger minFPS;

- (instancetype)initWithFrame:(CGRect)frame
                        color:(UIColor *)color NS_DESIGNATED_INITIALIZER;

- (void)onTick:(NSTimeInterval)timestamp;

@end

#endif
