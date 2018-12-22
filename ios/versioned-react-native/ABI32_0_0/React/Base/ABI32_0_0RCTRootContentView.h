/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTInvalidating.h>
#import <ReactABI32_0_0/ABI32_0_0RCTRootView.h>
#import <ReactABI32_0_0/ABI32_0_0RCTView.h>

@class ABI32_0_0RCTBridge;
@class ABI32_0_0RCTTouchHandler;

@interface ABI32_0_0RCTRootContentView : ABI32_0_0RCTView <ABI32_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI32_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI32_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI32_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI32_0_0RCTBridge *)bridge
                     ReactABI32_0_0Tag:(NSNumber *)ReactABI32_0_0Tag
               sizeFlexiblity:(ABI32_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
