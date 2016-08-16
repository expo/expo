/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI5_0_0RCTInvalidating.h"
#import "ABI5_0_0RCTView.h"

@class ABI5_0_0RCTBridge;

@interface ABI5_0_0RCTModalHostView : UIView <ABI5_0_0RCTInvalidating>

@property (nonatomic, assign, getter=isAnimated) BOOL animated;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI5_0_0RCTDirectEventBlock onShow;

- (instancetype)initWithBridge:(ABI5_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
