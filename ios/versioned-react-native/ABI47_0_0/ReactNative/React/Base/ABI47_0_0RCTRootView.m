/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTRootView.h"
#import "ABI47_0_0RCTRootViewDelegate.h"
#import "ABI47_0_0RCTRootViewInternal.h"

#import <objc/runtime.h>

#import "ABI47_0_0RCTAssert.h"
#import "ABI47_0_0RCTBridge+Private.h"
#import "ABI47_0_0RCTBridge.h"
#import "ABI47_0_0RCTConstants.h"
#import "ABI47_0_0RCTKeyCommands.h"
#import "ABI47_0_0RCTLog.h"
#import "ABI47_0_0RCTPerformanceLogger.h"
#import "ABI47_0_0RCTProfile.h"
#import "ABI47_0_0RCTRootContentView.h"
#import "ABI47_0_0RCTRootShadowView.h"
#import "ABI47_0_0RCTTouchHandler.h"
#import "ABI47_0_0RCTUIManager.h"
#import "ABI47_0_0RCTUIManagerUtils.h"
#import "ABI47_0_0RCTUtils.h"
#import "ABI47_0_0RCTView.h"
#import "ABI47_0_0UIView+React.h"

NSString *const ABI47_0_0RCTContentDidAppearNotification = @"ABI47_0_0RCTContentDidAppearNotification";

@interface ABI47_0_0RCTUIManager (ABI47_0_0RCTRootView)

- (NSNumber *)allocateRootTag;

@end

@implementation ABI47_0_0RCTRootView {
  ABI47_0_0RCTBridge *_bridge;
  NSString *_moduleName;
  ABI47_0_0RCTRootContentView *_contentView;
  BOOL _passThroughTouches;
  CGSize _intrinsicContentSize;
}

- (instancetype)initWithFrame:(CGRect)frame
                       bridge:(ABI47_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
            initialProperties:(NSDictionary *)initialProperties
{
  ABI47_0_0RCTAssertMainQueue();
  ABI47_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI47_0_0RCTRootView");
  ABI47_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI47_0_0RCTRootView");

  ABI47_0_0RCT_PROFILE_BEGIN_EVENT(ABI47_0_0RCTProfileTagAlways, @"-[ABI47_0_0RCTRootView init]", nil);
  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI47_0_0RCTPLTTI];
  }

  if (self = [super initWithFrame:frame]) {
    self.backgroundColor = [UIColor whiteColor];

    _bridge = bridge;
    _moduleName = moduleName;
    _appProperties = [initialProperties copy];
    _loadingViewFadeDelay = 0.25;
    _loadingViewFadeDuration = 0.25;
    _sizeFlexibility = ABI47_0_0RCTRootViewSizeFlexibilityNone;
    _minimumSize = CGSizeZero;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(bridgeDidReload)
                                                 name:ABI47_0_0RCTJavaScriptWillStartLoadingNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(javaScriptDidLoad:)
                                                 name:ABI47_0_0RCTJavaScriptDidLoadNotification
                                               object:_bridge];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hideLoadingView)
                                                 name:ABI47_0_0RCTContentDidAppearNotification
                                               object:self];

    [self showLoadingView];
  }

  ABI47_0_0RCT_PROFILE_END_EVENT(ABI47_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  return [self initWithFrame:CGRectZero bridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI47_0_0RCTBridge *bridge = [[ABI47_0_0RCTBridge alloc] initWithBundleURL:bundleURL moduleProvider:nil launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (BOOL)hasBridge
{
  return _bridge != nil;
}

- (ABI47_0_0RCTModuleRegistry *)moduleRegistry
{
  return _bridge.moduleRegistry;
}

- (id<ABI47_0_0RCTEventDispatcherProtocol>)eventDispatcher
{
  return [self.moduleRegistry moduleForName:"EventDispatcher"];
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
      _sizeFlexibility & ABI47_0_0RCTRootViewSizeFlexibilityWidth ? fitSize.width : currentSize.width,
      _sizeFlexibility & ABI47_0_0RCTRootViewSizeFlexibilityHeight ? fitSize.height : currentSize.height);

  // Following the given size constraints.
  fitSize = CGSizeMake(MIN(size.width, fitSize.width), MIN(size.height, fitSize.height));

  return fitSize;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _contentView.frame = self.bounds;
  _loadingView.center = (CGPoint){CGRectGetMidX(self.bounds), CGRectGetMidY(self.bounds)};
}

- (void)setMinimumSize:(CGSize)minimumSize
{
  if (CGSizeEqualToSize(_minimumSize, minimumSize)) {
    return;
  }
  _minimumSize = minimumSize;
  __block NSNumber *tag = self.ABI47_0_0ReactTag;
  __weak typeof(self) weakSelf = self;
  ABI47_0_0RCTExecuteOnUIManagerQueue(^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf && strongSelf->_bridge.isValid) {
      ABI47_0_0RCTRootShadowView *shadowView = (ABI47_0_0RCTRootShadowView *)[strongSelf->_bridge.uiManager shadowViewForABI47_0_0ReactTag:tag];
      shadowView.minimumSize = minimumSize;
    }
  });
}

- (UIViewController *)ABI47_0_0ReactViewController
{
  return _ABI47_0_0ReactViewController ?: [super ABI47_0_0ReactViewController];
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
      dispatch_after(
          dispatch_time(DISPATCH_TIME_NOW, (int64_t)(_loadingViewFadeDelay * NSEC_PER_SEC)),
          dispatch_get_main_queue(),
          ^{
            [UIView transitionWithView:self
                duration:self->_loadingViewFadeDuration
                options:UIViewAnimationOptionTransitionCrossDissolve
                animations:^{
                  self->_loadingView.hidden = YES;
                }
                completion:^(__unused BOOL finished) {
                  [self->_loadingView removeFromSuperview];
                }];
          });
    } else {
      _loadingView.hidden = YES;
      [_loadingView removeFromSuperview];
    }
  }
}

- (NSNumber *)ABI47_0_0ReactTag
{
  ABI47_0_0RCTAssertMainQueue();
  if (!super.ABI47_0_0ReactTag) {
    /**
     * Every root view that is created must have a unique ABI47_0_0React tag.
     * Numbering of these tags goes from 1, 11, 21, 31, etc
     *
     * NOTE: Since the bridge persists, the RootViews might be reused, so the
     * ABI47_0_0React tag must be re-assigned every time a new UIManager is created.
     */
    self.ABI47_0_0ReactTag = ABI47_0_0RCTAllocateRootViewTag();
  }
  return super.ABI47_0_0ReactTag;
}

- (void)bridgeDidReload
{
  ABI47_0_0RCTAssertMainQueue();
  // Clear the ABI47_0_0ReactTag so it can be re-assigned
  self.ABI47_0_0ReactTag = nil;
}

- (void)javaScriptDidLoad:(NSNotification *)notification
{
  ABI47_0_0RCTAssertMainQueue();

  // Use the (batched) bridge that's sent in the notification payload, so the
  // ABI47_0_0RCTRootContentView is scoped to the right bridge
  ABI47_0_0RCTBridge *bridge = notification.userInfo[@"bridge"];
  if (bridge != _contentView.bridge) {
    [self bundleFinishedLoading:bridge];
  }
}

- (void)bundleFinishedLoading:(ABI47_0_0RCTBridge *)bridge
{
  ABI47_0_0RCTAssert(bridge != nil, @"Bridge cannot be nil");
  if (!bridge.valid) {
    return;
  }

  [_contentView removeFromSuperview];
  _contentView = [[ABI47_0_0RCTRootContentView alloc] initWithFrame:self.bounds
                                                    bridge:bridge
                                                  ABI47_0_0ReactTag:self.ABI47_0_0ReactTag
                                            sizeFlexiblity:_sizeFlexibility];
  [self runApplication:bridge];

  _contentView.passThroughTouches = _passThroughTouches;
  [self insertSubview:_contentView atIndex:0];

  if (_sizeFlexibility == ABI47_0_0RCTRootViewSizeFlexibilityNone) {
    self.intrinsicContentSize = self.bounds.size;
  }
}

- (void)runApplication:(ABI47_0_0RCTBridge *)bridge
{
  NSString *moduleName = _moduleName ?: @"";
  NSDictionary *appParameters = @{
    @"rootTag" : _contentView.ABI47_0_0ReactTag,
    @"initialProps" : _appProperties ?: @{},
  };

  ABI47_0_0RCTLogInfo(@"Running application %@ (%@)", moduleName, appParameters);
  [bridge enqueueJSCall:@"AppRegistry" method:@"runApplication" args:@[ moduleName, appParameters ] completion:NULL];
}

- (void)setSizeFlexibility:(ABI47_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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
  ABI47_0_0RCTAssertMainQueue();

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

  // Don't notify the delegate if the content remains invisible or its size has not changed
  if (bothSizesHaveAZeroDimension || sizesAreEqual) {
    return;
  }

  [self invalidateIntrinsicContentSize];
  [self.superview setNeedsLayout];

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

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];

  [[NSNotificationCenter defaultCenter]
      postNotificationName:ABI47_0_0RCTUserInterfaceStyleDidChangeNotification
                    object:self
                  userInfo:@{
                    ABI47_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey : self.traitCollection,
                  }];
}

- (void)dealloc
{
  [_contentView invalidate];
}

@end

@implementation ABI47_0_0RCTRootView (Deprecated)

- (CGSize)intrinsicSize
{
  ABI47_0_0RCTLogWarn(@"Calling deprecated `[-ABI47_0_0RCTRootView intrinsicSize]`.");
  return self.intrinsicContentSize;
}

- (void)cancelTouches
{
  ABI47_0_0RCTLogWarn(@"`-[ABI47_0_0RCTRootView cancelTouches]` is deprecated and will be deleted soon.");
  [[_contentView touchHandler] cancel];
}

@end
