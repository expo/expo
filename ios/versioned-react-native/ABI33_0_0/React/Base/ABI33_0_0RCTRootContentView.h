/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI33_0_0/ABI33_0_0RCTInvalidating.h>
#import <ReactABI33_0_0/ABI33_0_0RCTRootView.h>
#import <ReactABI33_0_0/ABI33_0_0RCTView.h>

@class ABI33_0_0RCTBridge;
@class ABI33_0_0RCTTouchHandler;

@interface ABI33_0_0RCTRootContentView : ABI33_0_0RCTView <ABI33_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI33_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI33_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI33_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI33_0_0RCTBridge *)bridge
                     ReactABI33_0_0Tag:(NSNumber *)ReactABI33_0_0Tag
               sizeFlexiblity:(ABI33_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
