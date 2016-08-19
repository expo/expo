/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTWrapperViewController.h"

#import <UIKit/UIScrollView.h>

#import "ABI9_0_0RCTEventDispatcher.h"
#import "ABI9_0_0RCTNavItem.h"
#import "ABI9_0_0RCTUtils.h"
#import "ABI9_0_0RCTViewControllerProtocol.h"
#import "UIView+ReactABI9_0_0.h"
#import "ABI9_0_0RCTAutoInsetsProtocol.h"

@implementation ABI9_0_0RCTWrapperViewController
{
  UIView *_wrapperView;
  UIView *_contentView;
  ABI9_0_0RCTEventDispatcher *_eventDispatcher;
  CGFloat _previousTopLayoutLength;
  CGFloat _previousBottomLayoutLength;
}

@synthesize currentTopLayoutGuide = _currentTopLayoutGuide;
@synthesize currentBottomLayoutGuide = _currentBottomLayoutGuide;

- (instancetype)initWithContentView:(UIView *)contentView
{
  ABI9_0_0RCTAssertParam(contentView);

  if ((self = [super initWithNibName:nil bundle:nil])) {
    _contentView = contentView;
    self.automaticallyAdjustsScrollViewInsets = NO;
  }
  return self;
}

- (instancetype)initWithNavItem:(ABI9_0_0RCTNavItem *)navItem
{
  if ((self = [self initWithContentView:navItem])) {
    _navItem = navItem;
  }
  return self;
}

ABI9_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithNibName:(NSString *)nn bundle:(NSBundle *)nb)
ABI9_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];

  _currentTopLayoutGuide = self.topLayoutGuide;
  _currentBottomLayoutGuide = self.bottomLayoutGuide;
}

static BOOL ABI9_0_0RCTFindScrollViewAndRefreshContentInsetInView(UIView *view)
{
  if ([view conformsToProtocol:@protocol(ABI9_0_0RCTAutoInsetsProtocol)]) {
    [(id <ABI9_0_0RCTAutoInsetsProtocol>) view refreshContentInset];
    return YES;
  }
  for (UIView *subview in view.subviews) {
    if (ABI9_0_0RCTFindScrollViewAndRefreshContentInsetInView(subview)) {
      return YES;
    }
  }
  return NO;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (_previousTopLayoutLength != _currentTopLayoutGuide.length ||
      _previousBottomLayoutLength != _currentBottomLayoutGuide.length) {
    ABI9_0_0RCTFindScrollViewAndRefreshContentInsetInView(_contentView);
    _previousTopLayoutLength = _currentTopLayoutGuide.length;
    _previousBottomLayoutLength = _currentBottomLayoutGuide.length;
  }
}

static UIView *ABI9_0_0RCTFindNavBarShadowViewInView(UIView *view)
{
  if ([view isKindOfClass:[UIImageView class]] && view.bounds.size.height <= 1) {
    return view;
  }
  for (UIView *subview in view.subviews) {
    UIView *shadowView = ABI9_0_0RCTFindNavBarShadowViewInView(subview);
    if (shadowView) {
      return shadowView;
    }
  }
  return nil;
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];

  // TODO: find a way to make this less-tightly coupled to navigation controller
  if ([self.parentViewController isKindOfClass:[UINavigationController class]])
  {
    [self.navigationController
     setNavigationBarHidden:_navItem.navigationBarHidden
     animated:animated];

    UINavigationBar *bar = self.navigationController.navigationBar;
    bar.barTintColor = _navItem.barTintColor;
    bar.tintColor = _navItem.tintColor;
    bar.translucent = _navItem.translucent;
    bar.titleTextAttributes = _navItem.titleTextColor ? @{
      NSForegroundColorAttributeName: _navItem.titleTextColor
    } : nil;

    ABI9_0_0RCTFindNavBarShadowViewInView(bar).hidden = _navItem.shadowHidden;

    UINavigationItem *item = self.navigationItem;
    item.title = _navItem.title;
    item.titleView = _navItem.titleImageView;
    item.backBarButtonItem = _navItem.backButtonItem;
    item.leftBarButtonItem = _navItem.leftButtonItem;
    item.rightBarButtonItem = _navItem.rightButtonItem;
  }
}

- (void)loadView
{
  // Add a wrapper so that the wrapper view managed by the
  // UINavigationController doesn't end up resetting the frames for
  //`contentView` which is a ReactABI9_0_0-managed view.
  _wrapperView = [[UIView alloc] initWithFrame:_contentView.bounds];
  [_wrapperView addSubview:_contentView];
  self.view = _wrapperView;
}

- (void)didMoveToParentViewController:(UIViewController *)parent
{
  // There's no clear setter for navigation controllers, but did move to parent
  // view controller provides the desired effect. This is called after a pop
  // finishes, be it a swipe to go back or a standard tap on the back button
  [super didMoveToParentViewController:parent];
  if (parent == nil || [parent isKindOfClass:[UINavigationController class]]) {
    [self.navigationListener wrapperViewController:self
                     didMoveToNavigationController:(UINavigationController *)parent];
  }
}

@end
