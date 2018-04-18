/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTTabBar.h"

#import "ABI27_0_0RCTEventDispatcher.h"
#import "ABI27_0_0RCTLog.h"
#import "ABI27_0_0RCTTabBarItem.h"
#import "ABI27_0_0RCTUtils.h"
#import "ABI27_0_0RCTView.h"
#import "ABI27_0_0RCTWrapperViewController.h"
#import "UIView+ReactABI27_0_0.h"

@interface ABI27_0_0RCTTabBar() <UITabBarControllerDelegate>

@end

@implementation ABI27_0_0RCTTabBar
{
  BOOL _tabsChanged;
  UITabBarController *_tabController;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _tabController = [UITabBarController new];
    _tabController.delegate = self;
    [self addSubview:_tabController.view];
  }
  return self;
}

ABI27_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (UIViewController *)ReactABI27_0_0ViewController
{
  return _tabController;
}

- (void)dealloc
{
  _tabController.delegate = nil;
  [_tabController removeFromParentViewController];
}

- (void)insertReactABI27_0_0Subview:(ABI27_0_0RCTTabBarItem *)subview atIndex:(NSInteger)atIndex
{
  if (![subview isKindOfClass:[ABI27_0_0RCTTabBarItem class]]) {
    ABI27_0_0RCTLogError(@"subview should be of type ABI27_0_0RCTTabBarItem");
    return;
  }
  [super insertReactABI27_0_0Subview:subview atIndex:atIndex];
  _tabsChanged = YES;
}

- (void)removeReactABI27_0_0Subview:(ABI27_0_0RCTTabBarItem *)subview
{
  if (self.ReactABI27_0_0Subviews.count == 0) {
    ABI27_0_0RCTLogError(@"should have at least one view to remove a subview");
    return;
  }
  [super removeReactABI27_0_0Subview:subview];
  _tabsChanged = YES;
}

- (void)didUpdateReactABI27_0_0Subviews
{
  // Do nothing, as subviews are managed by `uiManagerDidPerformMounting`
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self ReactABI27_0_0AddControllerToClosestParent:_tabController];
  _tabController.view.frame = self.bounds;
}

- (void)uiManagerDidPerformMounting
{
  // we can't hook up the VC hierarchy in 'init' because the subviews aren't
  // hooked up yet, so we do it on demand here whenever a transaction has finished
  [self ReactABI27_0_0AddControllerToClosestParent:_tabController];

  if (_tabsChanged) {

    NSMutableArray<UIViewController *> *viewControllers = [NSMutableArray array];
    for (ABI27_0_0RCTTabBarItem *tab in [self ReactABI27_0_0Subviews]) {
      UIViewController *controller = tab.ReactABI27_0_0ViewController;
      if (!controller) {
        controller = [[ABI27_0_0RCTWrapperViewController alloc] initWithContentView:tab];
      }
      [viewControllers addObject:controller];
    }

    _tabController.viewControllers = viewControllers;
    _tabsChanged = NO;
  }

  [self.ReactABI27_0_0Subviews enumerateObjectsUsingBlock:^(UIView *view, NSUInteger index, __unused BOOL *stop) {

    ABI27_0_0RCTTabBarItem *tab = (ABI27_0_0RCTTabBarItem *)view;
    UIViewController *controller = self->_tabController.viewControllers[index];
    if (self->_unselectedTintColor) {
      [tab.barItem setTitleTextAttributes:@{NSForegroundColorAttributeName: self->_unselectedTintColor} forState:UIControlStateNormal];
    }

    [tab.barItem setTitleTextAttributes:@{NSForegroundColorAttributeName: self.tintColor} forState:UIControlStateSelected];

    controller.tabBarItem = tab.barItem;
#if TARGET_OS_TV
// On Apple TV, disable JS control of selection after initial render
    if (tab.selected && !tab.wasSelectedInJS) {
      self->_tabController.selectedViewController = controller;
    }
    tab.wasSelectedInJS = YES;
#else
    if (tab.selected) {
      self->_tabController.selectedViewController = controller;
    }
#endif
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

- (BOOL)translucent
{
  return _tabController.tabBar.isTranslucent;
}

- (void)setTranslucent:(BOOL)translucent
{
  _tabController.tabBar.translucent = translucent;
}

#if !TARGET_OS_TV
- (UIBarStyle)barStyle
{
  return _tabController.tabBar.barStyle;
}

- (void)setBarStyle:(UIBarStyle)barStyle
{
  _tabController.tabBar.barStyle = barStyle;
}
#endif

- (void)setUnselectedItemTintColor:(UIColor *)unselectedItemTintColor {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
  if ([_tabController.tabBar respondsToSelector:@selector(unselectedItemTintColor)]) {
    _tabController.tabBar.unselectedItemTintColor = unselectedItemTintColor;
  }
#endif
}

- (UITabBarItemPositioning)itemPositioning
{
#if TARGET_OS_TV
  return 0;
#else
  return _tabController.tabBar.itemPositioning;
#endif
}

- (void)setItemPositioning:(UITabBarItemPositioning)itemPositioning
{
#if !TARGET_OS_TV
  _tabController.tabBar.itemPositioning = itemPositioning;
#endif
}

#pragma mark - UITabBarControllerDelegate

#if TARGET_OS_TV

- (void)tabBarController:(UITabBarController *)tabBarController didSelectViewController:(nonnull UIViewController *)viewController
{
  NSUInteger index = [tabBarController.viewControllers indexOfObject:viewController];
  ABI27_0_0RCTTabBarItem *tab = (ABI27_0_0RCTTabBarItem *)self.ReactABI27_0_0Subviews[index];
  if (tab.onPress) tab.onPress(nil);
  return;
}

#else

- (BOOL)tabBarController:(UITabBarController *)tabBarController shouldSelectViewController:(UIViewController *)viewController
{
  NSUInteger index = [tabBarController.viewControllers indexOfObject:viewController];
  ABI27_0_0RCTTabBarItem *tab = (ABI27_0_0RCTTabBarItem *)self.ReactABI27_0_0Subviews[index];
  if (tab.onPress) tab.onPress(nil);
  return NO;
}

#endif

#if TARGET_OS_TV

- (BOOL)isUserInteractionEnabled
{
  return YES;
}

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
  if (context.nextFocusedView == self) {
    [self becomeFirstResponder];
  } else {
    [self resignFirstResponder];
  }
}

#endif

@end
