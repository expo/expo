/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTInvalidating.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootView.h>
#import <ABI47_0_0React/ABI47_0_0RCTView.h>

@class ABI47_0_0RCTBridge;
@class ABI47_0_0RCTTouchHandler;

@interface ABI47_0_0RCTRootContentView : ABI47_0_0RCTView <ABI47_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI47_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI47_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI47_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI47_0_0RCTBridge *)bridge
                     ABI47_0_0ReactTag:(NSNumber *)ABI47_0_0ReactTag
               sizeFlexiblity:(ABI47_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
