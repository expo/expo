/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI18_0_0/ABI18_0_0RCTViewControllerProtocol.h>

@class ABI18_0_0RCTNavItem;
@class ABI18_0_0RCTWrapperViewController;

@protocol ABI18_0_0RCTWrapperViewControllerNavigationListener <NSObject>

- (void)wrapperViewController:(ABI18_0_0RCTWrapperViewController *)wrapperViewController
didMoveToNavigationController:(UINavigationController *)navigationController;

@end

@interface ABI18_0_0RCTWrapperViewController : UIViewController <ABI18_0_0RCTViewControllerProtocol>

- (instancetype)initWithContentView:(UIView *)contentView NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithNavItem:(ABI18_0_0RCTNavItem *)navItem;

@property (nonatomic, weak) id<ABI18_0_0RCTWrapperViewControllerNavigationListener> navigationListener;
@property (nonatomic, strong) ABI18_0_0RCTNavItem *navItem;

@end
