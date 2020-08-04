/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTInvalidating.h>
#import <ABI37_0_0React/ABI37_0_0RCTRootView.h>
#import <ABI37_0_0React/ABI37_0_0RCTView.h>

@class ABI37_0_0RCTBridge;
@class ABI37_0_0RCTTouchHandler;

@interface ABI37_0_0RCTRootContentView : ABI37_0_0RCTView <ABI37_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI37_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI37_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI37_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI37_0_0RCTBridge *)bridge
                     ABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
               sizeFlexiblity:(ABI37_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
