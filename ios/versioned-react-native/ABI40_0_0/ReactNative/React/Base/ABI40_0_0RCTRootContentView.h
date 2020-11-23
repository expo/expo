/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTInvalidating.h>
#import <ABI40_0_0React/ABI40_0_0RCTRootView.h>
#import <ABI40_0_0React/ABI40_0_0RCTView.h>

@class ABI40_0_0RCTBridge;
@class ABI40_0_0RCTTouchHandler;

@interface ABI40_0_0RCTRootContentView : ABI40_0_0RCTView <ABI40_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI40_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI40_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI40_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI40_0_0RCTBridge *)bridge
                     ABI40_0_0ReactTag:(NSNumber *)ABI40_0_0ReactTag
               sizeFlexiblity:(ABI40_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
