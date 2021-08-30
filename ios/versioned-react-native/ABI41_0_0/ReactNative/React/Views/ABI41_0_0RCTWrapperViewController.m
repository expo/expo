/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTWrapperViewController.h"

#import <UIKit/UIScrollView.h>

#import "ABI41_0_0RCTAutoInsetsProtocol.h"
#import "ABI41_0_0RCTEventDispatcher.h"
#import "ABI41_0_0RCTUtils.h"
#import "ABI41_0_0UIView+React.h"

@implementation ABI41_0_0RCTWrapperViewController {
  UIView *_wrapperView;
  UIView *_contentView;
  ABI41_0_0RCTEventDispatcher *_eventDispatcher;
  CGFloat _previousTopLayoutLength;
  CGFloat _previousBottomLayoutLength;

  id<UILayoutSupport> _currentTopLayoutGuide;
  id<UILayoutSupport> _currentBottomLayoutGuide;
}

- (instancetype)initWithContentView:(UIView *)contentView
{
  ABI41_0_0RCTAssertParam(contentView);

  if ((self = [super initWithNibName:nil bundle:nil])) {
    _contentView = contentView;
    self.automaticallyAdjustsScrollViewInsets = NO;
  }
  return self;
}

ABI41_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithNibName : (NSString *)nn bundle : (NSBundle *)nb)
ABI41_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];

  _currentTopLayoutGuide = self.topLayoutGuide;
  _currentBottomLayoutGuide = self.bottomLayoutGuide;
}

static BOOL ABI41_0_0RCTFindScrollViewAndRefreshContentInsetInView(UIView *view)
{
  if ([view conformsToProtocol:@protocol(ABI41_0_0RCTAutoInsetsProtocol)]) {
    [(id<ABI41_0_0RCTAutoInsetsProtocol>)view refreshContentInset];
    return YES;
  }
  for (UIView *subview in view.subviews) {
    if (ABI41_0_0RCTFindScrollViewAndRefreshContentInsetInView(subview)) {
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
    ABI41_0_0RCTFindScrollViewAndRefreshContentInsetInView(_contentView);
    _previousTopLayoutLength = _currentTopLayoutGuide.length;
    _previousBottomLayoutLength = _currentBottomLayoutGuide.length;
  }
}

- (void)loadView
{
  // Add a wrapper so that the wrapper view managed by the
  // UINavigationController doesn't end up resetting the frames for
  //`contentView` which is a ABI41_0_0React-managed view.
  _wrapperView = [[UIView alloc] initWithFrame:_contentView.bounds];
  [_wrapperView addSubview:_contentView];
  self.view = _wrapperView;
}

@end
