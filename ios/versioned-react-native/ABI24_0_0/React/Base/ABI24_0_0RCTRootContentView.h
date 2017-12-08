/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI24_0_0/ABI24_0_0RCTInvalidating.h>
#import <ReactABI24_0_0/ABI24_0_0RCTRootView.h>
#import <ReactABI24_0_0/ABI24_0_0RCTView.h>

@class ABI24_0_0RCTBridge;
@class ABI24_0_0RCTTouchHandler;

@interface ABI24_0_0RCTRootContentView : ABI24_0_0RCTView <ABI24_0_0RCTInvalidating>

@property (nonatomic, readonly, weak) ABI24_0_0RCTBridge *bridge;
@property (nonatomic, readonly, assign) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI24_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, readonly, assign) CGSize availableSize;

@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI24_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI24_0_0RCTBridge *)bridge
                     ReactABI24_0_0Tag:(NSNumber *)ReactABI24_0_0Tag
               sizeFlexiblity:(ABI24_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
