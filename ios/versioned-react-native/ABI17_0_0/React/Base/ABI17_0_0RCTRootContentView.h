/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI17_0_0/ABI17_0_0RCTInvalidating.h>
#import <ReactABI17_0_0/ABI17_0_0RCTRootView.h>
#import <ReactABI17_0_0/ABI17_0_0RCTView.h>

@class ABI17_0_0RCTBridge;
@class ABI17_0_0RCTTouchHandler;

@interface ABI17_0_0RCTRootContentView : ABI17_0_0RCTView <ABI17_0_0RCTInvalidating>

@property (nonatomic, readonly) BOOL contentHasAppeared;
@property (nonatomic, readonly, strong) ABI17_0_0RCTTouchHandler *touchHandler;
@property (nonatomic, assign) BOOL passThroughTouches;
@property (nonatomic, assign) ABI17_0_0RCTRootViewSizeFlexibility sizeFlexibility;
@property (nonatomic, readonly) CGSize availableSize;

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI17_0_0RCTBridge *)bridge
                     ReactABI17_0_0Tag:(NSNumber *)ReactABI17_0_0Tag
               sizeFlexiblity:(ABI17_0_0RCTRootViewSizeFlexibility)sizeFlexibility NS_DESIGNATED_INITIALIZER;

@end
