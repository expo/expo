/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class ABI27_0_0RCTBridge;
@class ABI27_0_0RCTInputAccessoryViewContent;

@interface ABI27_0_0RCTInputAccessoryView : UIView

- (instancetype)initWithBridge:(ABI27_0_0RCTBridge *)bridge;

@property (nonatomic, readonly, strong) ABI27_0_0RCTInputAccessoryViewContent *content;

@end
