/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTInvalidating.h>
#import <ReactABI34_0_0/ABI34_0_0RCTRootView.h>
#import <ReactABI34_0_0/ABI34_0_0RCTView.h>

@class ABI34_0_0RCTBridge;
@class ABI34_0_0RCTTouchHandler;

@interface ABI34_0_0RCTRootContentView : ABI34_0_0RCTView <ABI34_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI34_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI34_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI34_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI34_0_0RCTBridge *)bridge
                     ReactABI34_0_0Tag:(NSNumber *)ReactABI34_0_0Tag
               sizeFlexiblity:(ABI34_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
