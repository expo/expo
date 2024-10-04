/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTPullToRefreshViewComponentView.h"

#import <ABI42_0_0React/components/rncore/ComponentDescriptors.h>
#import <ABI42_0_0React/components/rncore/EventEmitters.h>
#import <ABI42_0_0React/components/rncore/Props.h>
#import <ABI42_0_0React/components/rncore/ABI42_0_0RCTComponentViewHelpers.h>

#import <ABI42_0_0React/ABI42_0_0RCTConversions.h>
#import <ABI42_0_0React/ABI42_0_0RCTRefreshableProtocol.h>
#import <ABI42_0_0React/ABI42_0_0RCTScrollViewComponentView.h>

#import "ABI42_0_0FBABI42_0_0RCTFabricComponentsPlugins.h"

using namespace ABI42_0_0facebook::ABI42_0_0React;

@interface ABI42_0_0RCTPullToRefreshViewComponentView () <ABI42_0_0RCTPullToRefreshViewViewProtocol, ABI42_0_0RCTRefreshableProtocol>
@end

@implementation ABI42_0_0RCTPullToRefreshViewComponentView {
  UIRefreshControl *_refreshControl;
  ABI42_0_0RCTScrollViewComponentView *_scrollViewComponentView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    // This view is not designed to be visible, it only serves UIViewController-like purpose managing
    // attaching and detaching of a pull-to-refresh view to a scroll view.
    // The pull-to-refresh view is not a subview of this view.
    self.hidden = YES;

    static auto const defaultProps = std::make_shared<PullToRefreshViewProps const>();
    _props = defaultProps;

    _refreshControl = [[UIRefreshControl alloc] init];
    [_refreshControl addTarget:self
                        action:@selector(handleUIControlEventValueChanged)
              forControlEvents:UIControlEventValueChanged];
  }

  return self;
}

#pragma mark - ABI42_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<PullToRefreshViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldConcreteProps = *std::static_pointer_cast<PullToRefreshViewProps const>(_props);
  auto const &newConcreteProps = *std::static_pointer_cast<PullToRefreshViewProps const>(props);

  if (newConcreteProps.refreshing != oldConcreteProps.refreshing) {
    if (newConcreteProps.refreshing) {
      [_refreshControl beginRefreshing];
    } else {
      [_refreshControl endRefreshing];
    }
  }

  BOOL needsUpdateTitle = NO;

  if (newConcreteProps.title != oldConcreteProps.title) {
    needsUpdateTitle = YES;
  }

  if (newConcreteProps.titleColor != oldConcreteProps.titleColor) {
    needsUpdateTitle = YES;
  }

  if (needsUpdateTitle) {
    [self _updateTitle];
  }

  [super updateProps:props oldProps:oldProps];
}

#pragma mark -

- (void)handleUIControlEventValueChanged
{
  std::static_pointer_cast<PullToRefreshViewEventEmitter const>(_eventEmitter)->onRefresh({});
}

- (void)_updateTitle
{
  auto const &concreteProps = *std::static_pointer_cast<PullToRefreshViewProps const>(_props);

  if (concreteProps.title.empty()) {
    _refreshControl.attributedTitle = nil;
    return;
  }

  NSMutableDictionary *attributes = [NSMutableDictionary dictionary];
  if (concreteProps.titleColor) {
    attributes[NSForegroundColorAttributeName] = ABI42_0_0RCTUIColorFromSharedColor(concreteProps.titleColor);
  }

  _refreshControl.attributedTitle =
      [[NSAttributedString alloc] initWithString:ABI42_0_0RCTNSStringFromString(concreteProps.title) attributes:attributes];
}

#pragma mark - Attaching & Detaching

- (void)didMoveToWindow
{
  if (self.window) {
    [self _attach];
  } else {
    [self _detach];
  }
}

- (void)_attach
{
  if (_scrollViewComponentView) {
    [self _detach];
  }

  _scrollViewComponentView = [ABI42_0_0RCTScrollViewComponentView findScrollViewComponentViewForView:self];
  if (!_scrollViewComponentView) {
    return;
  }

  if (@available(macOS 13.0, *)) {
    _scrollViewComponentView.scrollView.refreshControl = _refreshControl;
  }
}

- (void)_detach
{
  if (!_scrollViewComponentView) {
    return;
  }

  // iOS requires to end refreshing before unmounting.
  [_refreshControl endRefreshing];

  if (@available(macOS 13.0, *)) {
    _scrollViewComponentView.scrollView.refreshControl = nil;
  }
  _scrollViewComponentView = nil;
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  ABI42_0_0RCTPullToRefreshViewHandleCommand(self, commandName, args);
}

- (void)setNativeRefreshing:(BOOL)refreshing
{
  if (refreshing) {
    [_refreshControl beginRefreshing];
  } else {
    [_refreshControl endRefreshing];
  }
}

#pragma mark - ABI42_0_0RCTRefreshableProtocol

- (void)setRefreshing:(BOOL)refreshing
{
  [self setNativeRefreshing:refreshing];
}

#pragma mark -

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  return @"RefreshControl";
}

@end

Class<ABI42_0_0RCTComponentViewProtocol> ABI42_0_0RCTPullToRefreshViewCls(void)
{
  return ABI42_0_0RCTPullToRefreshViewComponentView.class;
}
