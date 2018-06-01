/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTInvalidating.h>
#import <ReactABI28_0_0/ABI28_0_0RCTRootView.h>
#import <ReactABI28_0_0/ABI28_0_0RCTView.h>

@class ABI28_0_0RCTBridge;
@class ABI28_0_0RCTTouchHandler;

@interface ABI28_0_0RCTRootContentView : ABI28_0_0RCTView <ABI28_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI28_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI28_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI28_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI28_0_0RCTBridge *)bridge
                     ReactABI28_0_0Tag:(NSNumber *)ReactABI28_0_0Tag
               sizeFlexiblity:(ABI28_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
