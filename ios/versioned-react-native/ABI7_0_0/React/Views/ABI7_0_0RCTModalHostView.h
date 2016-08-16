/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI7_0_0RCTInvalidating.h"
#import "ABI7_0_0RCTView.h"

@class ABI7_0_0RCTBridge;

@interface ABI7_0_0RCTModalHostView : UIView <ABI7_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI7_0_0RCTDirectEventBlock onShow;

- (instancetype)initWithBridge:(ABI7_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
