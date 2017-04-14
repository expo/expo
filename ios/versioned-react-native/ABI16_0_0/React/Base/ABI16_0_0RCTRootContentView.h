/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI16_0_0/ABI16_0_0RCTInvalidating.h>
#import <ReactABI16_0_0/ABI16_0_0RCTRootView.h>
#import <ReactABI16_0_0/ABI16_0_0RCTView.h>

@class ABI16_0_0RCTBridge;
@class ABI16_0_0RCTTouchHandler;

@interface ABI16_0_0RCTRootContentView : ABI16_0_0RCTView <ABI16_0_0RCTInvalidating>

@property (nonatomic, readonly) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI16_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI16_0_0RCTRootViewSizeFlexibility sizeFlexibility;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI16_0_0RCTBridge *)bridge
                     ReactABI16_0_0Tag:(NSNumber *)ReactABI16_0_0Tag
               sizeFlexiblity:(ABI16_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
