/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTInvalidating.h>
#import <ABI41_0_0React/ABI41_0_0RCTRootView.h>
#import <ABI41_0_0React/ABI41_0_0RCTView.h>

@class ABI41_0_0RCTBridge;
@class ABI41_0_0RCTTouchHandler;

@interface ABI41_0_0RCTRootContentView : ABI41_0_0RCTView <ABI41_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI41_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI41_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI41_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI41_0_0RCTBridge *)bridge
                     ABI41_0_0ReactTag:(NSNumber *)ABI41_0_0ReactTag
               sizeFlexiblity:(ABI41_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
