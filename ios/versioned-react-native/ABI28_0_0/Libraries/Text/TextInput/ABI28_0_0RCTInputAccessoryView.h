/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class ABI28_0_0RCTBridge;
@class ABI28_0_0RCTInputAccessoryViewContent;

@interface ABI28_0_0RCTInputAccessoryView : UIView

- (instancetype)initWithBridge:(ABI28_0_0RCTBridge *)bridge;

@property (nonatomic, readonly, strong) ABI28_0_0RCTInputAccessoryViewContent *content;

@end
