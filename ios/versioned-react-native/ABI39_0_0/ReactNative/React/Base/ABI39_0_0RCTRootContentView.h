/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI39_0_0React/ABI39_0_0RCTInvalidating.h>
#import <ABI39_0_0React/ABI39_0_0RCTRootView.h>
#import <ABI39_0_0React/ABI39_0_0RCTView.h>

@class ABI39_0_0RCTBridge;
@class ABI39_0_0RCTTouchHandler;

@interface ABI39_0_0RCTRootContentView : ABI39_0_0RCTView <ABI39_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI39_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI39_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI39_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI39_0_0RCTBridge *)bridge
                     ABI39_0_0ReactTag:(NSNumber *)ABI39_0_0ReactTag
               sizeFlexiblity:(ABI39_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
