/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI35_0_0/ABI35_0_0RCTInvalidating.h>
#import <ReactABI35_0_0/ABI35_0_0RCTRootView.h>
#import <ReactABI35_0_0/ABI35_0_0RCTView.h>

@class ABI35_0_0RCTBridge;
@class ABI35_0_0RCTTouchHandler;

@interface ABI35_0_0RCTRootContentView : ABI35_0_0RCTView <ABI35_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI35_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI35_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI35_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI35_0_0RCTBridge *)bridge
                     ReactABI35_0_0Tag:(NSNumber *)ReactABI35_0_0Tag
               sizeFlexiblity:(ABI35_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
