/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTFrameUpdate.h>

@class ABI30_0_0RCTBridge;

@interface ABI30_0_0RCTNavigator : UIView <ABI30_0_0RCTFrameUpdateObserver>

@property (nonatomic, strong) UIView *ReactABI30_0_0NavSuperviewLink;
@property (nonatomic, assign) NSInteger requestedTopOfStack;
@property (nonatomic, assign) BOOL interactivePopGestureEnabled;

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

/**
 * Schedules a JavaScript navigation and prevents `UIKit` from navigating until
 * JavaScript has sent its scheduled navigation.
 *
 * @returns Whether or not a JavaScript driven navigation could be
 * scheduled/reserved. If returning `NO`, JavaScript should usually just do
 * nothing at all.
 */
- (BOOL)requestSchedulingJavaScriptNavigation;

- (void)uiManagerDidPerformMounting;

@end
