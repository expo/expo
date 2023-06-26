/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTWrapperViewController.h"

#import <UIKit/UIScrollView.h>

#import "ABI49_0_0RCTAutoInsetsProtocol.h"
#import "ABI49_0_0RCTUtils.h"
#import "ABI49_0_0UIView+React.h"

@implementation ABI49_0_0RCTWrapperViewController {
  UIView *_wrapperView;
  UIView *_contentView;
  CGFloat _previousTopInset;
  CGFloat _previousBottomInset;

  CGFloat _currentTopInset;
  CGFloat _currentBottomInset;
}

- (instancetype)initWithContentView:(UIView *)contentView
{
  ABI49_0_0RCTAssertParam(contentView);

  if ((self = [super initWithNibName:nil bundle:nil])) {
    _contentView = contentView;
    self.automaticallyAdjustsScrollViewInsets = NO;
  }
  return self;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithNibName : (NSString *)nn bundle : (NSBundle *)nb)
ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];

  _currentTopInset = self.view.safeAreaInsets.top;
  _currentBottomInset = self.view.safeAreaInsets.bottom;
}

static BOOL ABI49_0_0RCTFindScrollViewAndRefreshContentInsetInView(UIView *view)
{
  if ([view conformsToProtocol:@protocol(ABI49_0_0RCTAutoInsetsProtocol)]) {
    [(id<ABI49_0_0RCTAutoInsetsProtocol>)view refreshContentInset];
    return YES;
  }
  for (UIView *subview in view.subviews) {
    if (ABI49_0_0RCTFindScrollViewAndRefreshContentInsetInView(subview)) {
      return YES;
    }
  }
  return NO;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (_previousTopInset != _currentTopInset || _previousBottomInset != _currentBottomInset) {
    ABI49_0_0RCTFindScrollViewAndRefreshContentInsetInView(_contentView);
    _previousTopInset = _currentTopInset;
    _previousBottomInset = _currentBottomInset;
  }
}

- (void)loadView
{
  // Add a wrapper so that the wrapper view managed by the
  // UINavigationController doesn't end up resetting the frames for
  //`contentView` which is a ABI49_0_0React-managed view.
  _wrapperView = [[UIView alloc] initWithFrame:_contentView.bounds];
  [_wrapperView addSubview:_contentView];
  self.view = _wrapperView;
}

@end
