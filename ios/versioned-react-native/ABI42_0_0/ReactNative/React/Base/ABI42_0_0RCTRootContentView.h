/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTInvalidating.h>
#import <ABI42_0_0React/ABI42_0_0RCTRootView.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>

@class ABI42_0_0RCTBridge;
@class ABI42_0_0RCTTouchHandler;

@interface ABI42_0_0RCTRootContentView : ABI42_0_0RCTView <ABI42_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI42_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI42_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI42_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI42_0_0RCTBridge *)bridge
                     ABI42_0_0ReactTag:(NSNumber *)ABI42_0_0ReactTag
               sizeFlexiblity:(ABI42_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
