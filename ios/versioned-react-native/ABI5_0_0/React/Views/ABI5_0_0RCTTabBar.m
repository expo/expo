/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTTabBar.h"

#import "ABI5_0_0RCTEventDispatcher.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTTabBarItem.h"
#import "ABI5_0_0RCTUtils.h"
#import "ABI5_0_0RCTView.h"
#import "ABI5_0_0RCTViewControllerProtocol.h"
#import "ABI5_0_0RCTWrapperViewController.h"
#import "UIView+ReactABI5_0_0.h"

@interface ABI5_0_0RCTTabBar() <UITabBarControllerDelegate>

@end

@implementation ABI5_0_0RCTTabBar
{
  BOOL _tabsChanged;
  UITabBarController *_tabController;
  NSMutableArray<ABI5_0_0RCTTabBarItem *> *_tabViews;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _tabViews = [NSMutableArray new];
    _tabController = [UITabBarController new];
    _tabController.delegate = self;
    [self addSubview:_tabController.view];
  }
  return self;
}

ABI5_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (UIViewController *)ReactABI5_0_0ViewController
{
  return _tabController;
}

- (void)dealloc
{
  _tabController.delegate = nil;
  [_tabController removeFromParentViewController];
}

- (NSArray<ABI5_0_0RCTTabBarItem *> *)ReactABI5_0_0Subviews
{
  return _tabViews;
}

- (void)insertReactABI5_0_0Subview:(ABI5_0_0RCTTabBarItem *)view atIndex:(NSInteger)atIndex
{
  if (![view isKindOfClass:[ABI5_0_0RCTTabBarItem class]]) {
    ABI5_0_0RCTLogError(@"subview should be of type ABI5_0_0RCTTabBarItem");
    return;
  }
  [_tabViews insertObject:view atIndex:atIndex];
  _tabsChanged = YES;
}

- (void)removeReactABI5_0_0Subview:(ABI5_0_0RCTTabBarItem *)subview
{
  if (_tabViews.count == 0) {
    ABI5_0_0RCTLogError(@"should have at least one view to remove a subview");
    return;
  }
  [_tabViews removeObject:subview];
  _tabsChanged = YES;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self ReactABI5_0_0AddControllerToClosestParent:_tabController];
  _tabController.view.frame = self.bounds;
}

- (void)ReactABI5_0_0BridgeDidFinishTransaction
{
  // we can't hook up the VC hierarchy in 'init' because the subviews aren't
  // hooked up yet, so we do it on demand here whenever a transaction has finished
  [self ReactABI5_0_0AddControllerToClosestParent:_tabController];

  if (_tabsChanged) {

    NSMutableArray<UIViewController *> *viewControllers = [NSMutableArray array];
    for (ABI5_0_0RCTTabBarItem *tab in [self ReactABI5_0_0Subviews]) {
      UIViewController *controller = tab.ReactABI5_0_0ViewController;
      if (!controller) {
        controller = [[ABI5_0_0RCTWrapperViewController alloc] initWithContentView:tab];
      }
      [viewControllers addObject:controller];
    }

    _tabController.viewControllers = viewControllers;
    _tabsChanged = NO;
  }

  [_tabViews enumerateObjectsUsingBlock:
   ^(ABI5_0_0RCTTabBarItem *tab, NSUInteger index, __unused BOOL *stop) {
    UIViewController *controller = _tabController.viewControllers[index];
    controller.tabBarItem = tab.barItem;
    if (tab.selected) {
      _tabController.selectedViewController = controller;
    }
  }];
}

- (UIColor *)barTintColor
{
  return _tabController.tabBar.barTintColor;
}

- (void)setBarTintColor:(UIColor *)barTintColor
{
  _tabController.tabBar.barTintColor = barTintColor;
}

- (UIColor *)tintColor
{
  return _tabController.tabBar.tintColor;
}

- (void)setTintColor:(UIColor *)tintColor
{
  _tabController.tabBar.tintColor = tintColor;
}

- (BOOL)translucent {
  return _tabController.tabBar.isTranslucent;
}

- (void)setTranslucent:(BOOL)translucent {
  _tabController.tabBar.translucent = translucent;
}

#pragma mark - UITabBarControllerDelegate

- (BOOL)tabBarController:(UITabBarController *)tabBarController shouldSelectViewController:(UIViewController *)viewController
{
  NSUInteger index = [tabBarController.viewControllers indexOfObject:viewController];
  ABI5_0_0RCTTabBarItem *tab = _tabViews[index];
  if (tab.onPress) tab.onPress(nil);
  return NO;
}

@end
