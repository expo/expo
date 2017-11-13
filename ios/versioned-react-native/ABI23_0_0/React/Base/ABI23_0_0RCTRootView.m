/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTRootView.h"
#import "ABI23_0_0RCTRootViewDelegate.h"
#import "ABI23_0_0RCTRootViewInternal.h"

#import <objc/runtime.h>

#import "ABI23_0_0RCTAssert.h"
#import "ABI23_0_0RCTBridge.h"
#import "ABI23_0_0RCTBridge+Private.h"
#import "ABI23_0_0RCTEventDispatcher.h"
#import "ABI23_0_0RCTKeyCommands.h"
#import "ABI23_0_0RCTLog.h"
#import "ABI23_0_0RCTPerformanceLogger.h"
#import "ABI23_0_0RCTProfile.h"
#import "ABI23_0_0RCTRootContentView.h"
#import "ABI23_0_0RCTTouchHandler.h"
#import "ABI23_0_0RCTUIManager.h"
#import "ABI23_0_0RCTUtils.h"
#import "ABI23_0_0RCTView.h"
#import "UIView+ReactABI23_0_0.h"

#if TARGET_OS_TV
#import "ABI23_0_0RCTTVRemoteHandler.h"
#import "ABI23_0_0RCTTVNavigationEventEmitter.h"
#endif

NSString *const ABI23_0_0RCTContentDidAppearNotification = @"ABI23_0_0RCTContentDidAppearNotification";

@interface ABI23_0_0RCTUIManager (ABI23_0_0RCTRootView)

- (NSNumber *)allocateRootTag;

@end

@implementation ABI23_0_0RCTRootView
{
  ABI23_0_0RCTBridge *_bridge;
  NSString *_moduleName;
  ABI23_0_0RCTRootContentView *_contentView;
  BOOL _passThroughTouches;
  CGSize _intrinsicContentSize;
}

- (instancetype)initWithBridge:(ABI23_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI23_0_0RCTAssertMainQueue();
  ABI23_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI23_0_0RCTRootView");
  ABI23_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI23_0_0RCTRootView");

  ABI23_0_0RCT_PROFILE_BEGIN_EVENT(ABI23_0_0RCTProfileTagAlways, @"-[ABI23_0_0RCTRootView init]", nil);
  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI23_0_0RCTPLTTI];
  }

  if (self = [super initWithFrame:CGRectZero]) {
    self.backgroundColor = [UIColor whiteColor];

    _bridge = bridge;
    _moduleName = moduleName;
    _appProperties = [initialProperties copy];
    _loadingViewFadeDelay = 0.25;
    _loadingViewFadeDuration = 0.25;
    _sizeFlexibility = ABI23_0_0RCTRootViewSizeFlexibilityNone;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidReload)
                                                 name:ABI23_0_0RCTJavaScriptWillStartLoadingNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(javaScriptDidLoad:)
                                                 name:ABI23_0_0RCTJavaScriptDidLoadNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hideLoadingView)
                                                 name:ABI23_0_0RCTContentDidAppearNotification
                                               object:self];

#if TARGET_OS_TV
    self.tvRemoteHandler = [ABI23_0_0RCTTVRemoteHandler new];
    for (UIGestureRecognizer *gr in self.tvRemoteHandler.tvRemoteGestureRecognizers) {
      [self addGestureRecognizer:gr];
    }
#endif

    [self showLoadingView];
  }

  ABI23_0_0RCT_PROFILE_END_EVENT(ABI23_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI23_0_0RCTBridge *bridge = [[ABI23_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI23_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI23_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

#if TARGET_OS_TV
- (UIView *)preferredFocusedView
{
  if (self.ReactABI23_0_0PreferredFocusedView) {
    return self.ReactABI23_0_0PreferredFocusedView;
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
      _sizeFlexibility & ABI23_0_0RCTRootViewSizeFlexibilityWidth ? fitSize.width : currentSize.width,
      _sizeFlexibility & ABI23_0_0RCTRootViewSizeFlexibilityHeight ? fitSize.height : currentSize.height
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

- (UIViewController *)ReactABI23_0_0ViewController
{
  return _ReactABI23_0_0ViewController ?: [super ReactABI23_0_0ViewController];
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

- (NSNumber *)ReactABI23_0_0Tag
{
  ABI23_0_0RCTAssertMainQueue();
  if (!super.ReactABI23_0_0Tag) {
    /**
     * Every root view that is created must have a unique ReactABI23_0_0 tag.
     * Numbering of these tags goes from 1, 11, 21, 31, etc
     *
     * NOTE: Since the bridge persists, the RootViews might be reused, so the
     * ReactABI23_0_0 tag must be re-assigned every time a new UIManager is created.
     */
    self.ReactABI23_0_0Tag = [_bridge.uiManager allocateRootTag];
  }
  return super.ReactABI23_0_0Tag;
}

- (void)bridgeDidReload
{
  ABI23_0_0RCTAssertMainQueue();
  // Clear the ReactABI23_0_0Tag so it can be re-assigned
  self.ReactABI23_0_0Tag = nil;
}

- (void)javaScriptDidLoad:(NSNotification *)notification
{
  ABI23_0_0RCTAssertMainQueue();

  // Use the (batched) bridge that's sent in the notification payload, so the
  // ABI23_0_0RCTRootContentView is scoped to the right bridge
  ABI23_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _contentView.bridge) {
    [self bundleFinishedLoading:bridge];
  }
}

- (void)bundleFinishedLoading:(ABI23_0_0RCTBridge *)bridge
{
  ABI23_0_0RCTAssert(bridge != nil, @"Bridge cannot be nil");
  if (!bridge.valid) {
    return;
  }

  [_contentView removeFromSuperview];
  _contentView = [[ABI23_0_0RCTRootContentView alloc] initWithFrame:self.bounds
                                                    bridge:bridge
                                                  ReactABI23_0_0Tag:self.ReactABI23_0_0Tag
                                            sizeFlexiblity:_sizeFlexibility];
  [self runApplication:bridge];

  _contentView.backgroundColor = self.backgroundColor;
  _contentView.passThroughTouches = _passThroughTouches;
  [self insertSubview:_contentView atIndex:0];

  if (_sizeFlexibility == ABI23_0_0RCTRootViewSizeFlexibilityNone) {
    self.intrinsicContentSize = self.bounds.size;
  }
}

- (void)runApplication:(ABI23_0_0RCTBridge *)bridge
{
  NSString *moduleName = _moduleName ?: @"";
  NSDictionary *appParameters = @{
    @"rootTag": _contentView.ReactABI23_0_0Tag,
    @"initialProps": _appProperties ?: @{},
  };

  ABI23_0_0RCTLogInfo(@"Running application %@ (%@)", moduleName, appParameters);
  [bridge enqueueJSCall:@"AppRegistry"
                 method:@"runApplication"
                   args:@[moduleName, appParameters]
             completion:NULL];
}

- (void)setSizeFlexibility:(ABI23_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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
  ABI23_0_0RCTAssertMainQueue();

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

@implementation ABI23_0_0RCTRootView (Deprecated)

- (CGSize)intrinsicSize
{
  ABI23_0_0RCTLogWarn(@"Calling deprecated `[-ABI23_0_0RCTRootView intrinsicSize]`.");
  return self.intrinsicContentSize;
}

@end

@implementation ABI23_0_0RCTUIManager (ABI23_0_0RCTRootView)

- (NSNumber *)allocateRootTag
{
  NSNumber *rootTag = objc_getAssociatedObject(self, _cmd) ?: @1;
  objc_setAssociatedObject(self, _cmd, @(rootTag.integerValue + 10), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  return rootTag;
}

@end
