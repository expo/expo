/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTRootView.h"
#import "ABI25_0_0RCTRootViewDelegate.h"
#import "ABI25_0_0RCTRootViewInternal.h"

#import <objc/runtime.h>

#import "ABI25_0_0RCTAssert.h"
#import "ABI25_0_0RCTBridge.h"
#import "ABI25_0_0RCTBridge+Private.h"
#import "ABI25_0_0RCTEventDispatcher.h"
#import "ABI25_0_0RCTKeyCommands.h"
#import "ABI25_0_0RCTLog.h"
#import "ABI25_0_0RCTPerformanceLogger.h"
#import "ABI25_0_0RCTProfile.h"
#import "ABI25_0_0RCTRootContentView.h"
#import "ABI25_0_0RCTTouchHandler.h"
#import "ABI25_0_0RCTUIManager.h"
#import "ABI25_0_0RCTUIManagerUtils.h"
#import "ABI25_0_0RCTUtils.h"
#import "ABI25_0_0RCTView.h"
#import "UIView+ReactABI25_0_0.h"

#if TARGET_OS_TV
#import "ABI25_0_0RCTTVRemoteHandler.h"
#import "ABI25_0_0RCTTVNavigationEventEmitter.h"
#endif

NSString *const ABI25_0_0RCTContentDidAppearNotification = @"ABI25_0_0RCTContentDidAppearNotification";

@interface ABI25_0_0RCTUIManager (ABI25_0_0RCTRootView)

- (NSNumber *)allocateRootTag;

@end

@implementation ABI25_0_0RCTRootView
{
  ABI25_0_0RCTBridge *_bridge;
  NSString *_moduleName;
  ABI25_0_0RCTRootContentView *_contentView;
  BOOL _passThroughTouches;
  CGSize _intrinsicContentSize;
}

- (instancetype)initWithBridge:(ABI25_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI25_0_0RCTAssertMainQueue();
  ABI25_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI25_0_0RCTRootView");
  ABI25_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI25_0_0RCTRootView");

  ABI25_0_0RCT_PROFILE_BEGIN_EVENT(ABI25_0_0RCTProfileTagAlways, @"-[ABI25_0_0RCTRootView init]", nil);
  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI25_0_0RCTPLTTI];
  }

  if (self = [super initWithFrame:CGRectZero]) {
    self.backgroundColor = [UIColor whiteColor];

    _bridge = bridge;
    _moduleName = moduleName;
    _appProperties = [initialProperties copy];
    _loadingViewFadeDelay = 0.25;
    _loadingViewFadeDuration = 0.25;
    _sizeFlexibility = ABI25_0_0RCTRootViewSizeFlexibilityNone;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidReload)
                                                 name:ABI25_0_0RCTJavaScriptWillStartLoadingNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(javaScriptDidLoad:)
                                                 name:ABI25_0_0RCTJavaScriptDidLoadNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hideLoadingView)
                                                 name:ABI25_0_0RCTContentDidAppearNotification
                                               object:self];

#if TARGET_OS_TV
    self.tvRemoteHandler = [ABI25_0_0RCTTVRemoteHandler new];
    for (NSString *key in [self.tvRemoteHandler.tvRemoteGestureRecognizers allKeys]) {
      [self addGestureRecognizer:self.tvRemoteHandler.tvRemoteGestureRecognizers[key]];
    }
#endif

    [self showLoadingView];
  }

  ABI25_0_0RCT_PROFILE_END_EVENT(ABI25_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI25_0_0RCTBridge *bridge = [[ABI25_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI25_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI25_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

#if TARGET_OS_TV
- (UIView *)preferredFocusedView
{
  if (self.ReactABI25_0_0PreferredFocusedView) {
    return self.ReactABI25_0_0PreferredFocusedView;
  }
  return [super preferredFocusedView];
}
#endif

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  super.backgroundColor = backgroundColor;
  _contentView.backgroundColor = backgroundColor;
}

#pragma mark - passThroughTouches

- (BOOL)passThroughTouches
{
  return _contentView.passThroughTouches;
}

- (void)setPassThroughTouches:(BOOL)passThroughTouches
{
  _passThroughTouches = passThroughTouches;
  _contentView.passThroughTouches = passThroughTouches;
}

#pragma mark - Layout

- (CGSize)sizeThatFits:(CGSize)size
{
  CGSize fitSize = _intrinsicContentSize;
  CGSize currentSize = self.bounds.size;

  // Following the current `size` and current `sizeFlexibility` policy.
  fitSize = CGSizeMake(
      _sizeFlexibility & ABI25_0_0RCTRootViewSizeFlexibilityWidth ? fitSize.width : currentSize.width,
      _sizeFlexibility & ABI25_0_0RCTRootViewSizeFlexibilityHeight ? fitSize.height : currentSize.height
    );

  // Following the given size constraints.
  fitSize = CGSizeMake(
      MIN(size.width, fitSize.width),
      MIN(size.height, fitSize.height)
    );

  return fitSize;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _contentView.frame = self.bounds;
  _loadingView.center = (CGPoint){
    CGRectGetMidX(self.bounds),
    CGRectGetMidY(self.bounds)
  };
}

- (UIViewController *)ReactABI25_0_0ViewController
{
  return _ReactABI25_0_0ViewController ?: [super ReactABI25_0_0ViewController];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

- (void)setLoadingView:(UIView *)loadingView
{
  _loadingView = loadingView;
  if (!_contentView.contentHasAppeared) {
    [self showLoadingView];
  }
}

- (void)showLoadingView
{
  if (_loadingView && !_contentView.contentHasAppeared) {
    _loadingView.hidden = NO;
    [self addSubview:_loadingView];
  }
}

- (void)hideLoadingView
{
  if (_loadingView.superview == self && _contentView.contentHasAppeared) {
    if (_loadingViewFadeDuration > 0) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_loadingViewFadeDelay * NSEC_PER_SEC)),
                     dispatch_get_main_queue(), ^{

                       [UIView transitionWithView:self
                                         duration:self->_loadingViewFadeDuration
                                          options:UIViewAnimationOptionTransitionCrossDissolve
                                       animations:^{
                                         self->_loadingView.hidden = YES;
                                       } completion:^(__unused BOOL finished) {
                                         [self->_loadingView removeFromSuperview];
                                       }];
                     });
    } else {
      _loadingView.hidden = YES;
      [_loadingView removeFromSuperview];
    }
  }
}

- (NSNumber *)ReactABI25_0_0Tag
{
  ABI25_0_0RCTAssertMainQueue();
  if (!super.ReactABI25_0_0Tag) {
    /**
     * Every root view that is created must have a unique ReactABI25_0_0 tag.
     * Numbering of these tags goes from 1, 11, 21, 31, etc
     *
     * NOTE: Since the bridge persists, the RootViews might be reused, so the
     * ReactABI25_0_0 tag must be re-assigned every time a new UIManager is created.
     */
    self.ReactABI25_0_0Tag = ABI25_0_0RCTAllocateRootViewTag();
  }
  return super.ReactABI25_0_0Tag;
}

- (void)bridgeDidReload
{
  ABI25_0_0RCTAssertMainQueue();
  // Clear the ReactABI25_0_0Tag so it can be re-assigned
  self.ReactABI25_0_0Tag = nil;
}

- (void)javaScriptDidLoad:(NSNotification *)notification
{
  ABI25_0_0RCTAssertMainQueue();

  // Use the (batched) bridge that's sent in the notification payload, so the
  // ABI25_0_0RCTRootContentView is scoped to the right bridge
  ABI25_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _contentView.bridge) {
    [self bundleFinishedLoading:bridge];
  }
}

- (void)bundleFinishedLoading:(ABI25_0_0RCTBridge *)bridge
{
  ABI25_0_0RCTAssert(bridge != nil, @"Bridge cannot be nil");
  if (!bridge.valid) {
    return;
  }

  [_contentView removeFromSuperview];
  _contentView = [[ABI25_0_0RCTRootContentView alloc] initWithFrame:self.bounds
                                                    bridge:bridge
                                                  ReactABI25_0_0Tag:self.ReactABI25_0_0Tag
                                            sizeFlexiblity:_sizeFlexibility];
  [self runApplication:bridge];

  _contentView.backgroundColor = self.backgroundColor;
  _contentView.passThroughTouches = _passThroughTouches;
  [self insertSubview:_contentView atIndex:0];

  if (_sizeFlexibility == ABI25_0_0RCTRootViewSizeFlexibilityNone) {
    self.intrinsicContentSize = self.bounds.size;
  }
}

- (void)runApplication:(ABI25_0_0RCTBridge *)bridge
{
  NSString *moduleName = _moduleName ?: @"";
  NSDictionary *appParameters = @{
    @"rootTag": _contentView.ReactABI25_0_0Tag,
    @"initialProps": _appProperties ?: @{},
  };

  ABI25_0_0RCTLogInfo(@"Running application %@ (%@)", moduleName, appParameters);
  [bridge enqueueJSCall:@"AppRegistry"
                 method:@"runApplication"
                   args:@[moduleName, appParameters]
             completion:NULL];
}

- (void)setSizeFlexibility:(ABI25_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  if (_sizeFlexibility == sizeFlexibility) {
    return;
  }

  _sizeFlexibility = sizeFlexibility;
  [self setNeedsLayout];
  _contentView.sizeFlexibility = _sizeFlexibility;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  // The root view itself should never receive touches
  UIView *hitView = [super hitTest:point withEvent:event];
  if (self.passThroughTouches && hitView == self) {
    return nil;
  }
  return hitView;
}

- (void)setAppProperties:(NSDictionary *)appProperties
{
  ABI25_0_0RCTAssertMainQueue();

  if ([_appProperties isEqualToDictionary:appProperties]) {
    return;
  }

  _appProperties = [appProperties copy];

  if (_contentView && _bridge.valid && !_bridge.loading) {
    [self runApplication:_bridge];
  }
}

- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize
{
  BOOL oldSizeHasAZeroDimension = _intrinsicContentSize.height == 0 || _intrinsicContentSize.width == 0;
  BOOL newSizeHasAZeroDimension = intrinsicContentSize.height == 0 || intrinsicContentSize.width == 0;
  BOOL bothSizesHaveAZeroDimension = oldSizeHasAZeroDimension && newSizeHasAZeroDimension;

  BOOL sizesAreEqual = CGSizeEqualToSize(_intrinsicContentSize, intrinsicContentSize);

  _intrinsicContentSize = intrinsicContentSize;

  [self invalidateIntrinsicContentSize];
  [self.superview setNeedsLayout];

  // Don't notify the delegate if the content remains invisible or its size has not changed
  if (bothSizesHaveAZeroDimension || sizesAreEqual) {
    return;
  }

  [_delegate rootViewDidChangeIntrinsicSize:self];
}

- (CGSize)intrinsicContentSize
{
  return _intrinsicContentSize;
}

- (void)contentViewInvalidated
{
  [_contentView removeFromSuperview];
  _contentView = nil;
  [self showLoadingView];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_contentView invalidate];
}

- (void)cancelTouches
{
  [[_contentView touchHandler] cancel];
}

@end

@implementation ABI25_0_0RCTRootView (Deprecated)

- (CGSize)intrinsicSize
{
  ABI25_0_0RCTLogWarn(@"Calling deprecated `[-ABI25_0_0RCTRootView intrinsicSize]`.");
  return self.intrinsicContentSize;
}

@end
