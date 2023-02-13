/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI48_0_0RCTAssert.h"
#import "ABI48_0_0RCTBridge+Private.h"
#import "ABI48_0_0RCTBridge.h"
#import "ABI48_0_0RCTLog.h"
#import "ABI48_0_0RCTPerformanceLogger.h"
#import "ABI48_0_0RCTProfile.h"
#import "ABI48_0_0RCTRootContentView.h"
#import "ABI48_0_0RCTRootViewDelegate.h"
#import "ABI48_0_0RCTSurface.h"
#import "ABI48_0_0UIView+React.h"

static ABI48_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI48_0_0RCTRootViewSizeFlexibility sizeFlexibility)
{
  switch (sizeFlexibility) {
    case ABI48_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI48_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI48_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI48_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI48_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI48_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI48_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI48_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI48_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI48_0_0RCTRootViewSizeFlexibilityNone:
      return ABI48_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI48_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI48_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI48_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode)
{
  switch (sizeMeasureMode) {
    case ABI48_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI48_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI48_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI48_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI48_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI48_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI48_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI48_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI48_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI48_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI48_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI48_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI48_0_0RCTSurfaceHostingProxyRootView {
  ABI48_0_0RCTModuleRegistry *_moduleRegistry;
}

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI48_0_0RCTAssertMainQueue();
  ABI48_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI48_0_0RCTSurfaceHostingProxyRootView");
  ABI48_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI48_0_0RCTSurfaceHostingProxyRootView");

  ABI48_0_0RCT_PROFILE_BEGIN_EVENT(ABI48_0_0RCTProfileTagAlways, @"-[ABI48_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;
  _minimumSize = CGSizeZero;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI48_0_0RCTPLTTI];
  }

  // `ABI48_0_0RCTRootViewSizeFlexibilityNone` is the ABI48_0_0RCTRootView's default.
  ABI48_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI48_0_0RCTRootViewSizeFlexibilityNone);

  self = [super initWithBridge:bridge
                    moduleName:moduleName
             initialProperties:initialProperties
               sizeMeasureMode:sizeMeasureMode];

  ABI48_0_0RCT_PROFILE_END_EVENT(ABI48_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI48_0_0RCTBridge *bridge = [[ABI48_0_0RCTBridge alloc] initWithBundleURL:bundleURL moduleProvider:nil launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

- (instancetype)initWithSurface:(id<ABI48_0_0RCTSurfaceProtocol>)surface
                sizeMeasureMode:(ABI48_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
                 moduleRegistry:(ABI48_0_0RCTModuleRegistry *)moduleRegistry
{
  if (self = [super initWithSurface:surface sizeMeasureMode:sizeMeasureMode]) {
    _moduleRegistry = moduleRegistry;
  }

  return self;
}

- (BOOL)hasBridge
{
  return _bridge != nil;
}

- (ABI48_0_0RCTModuleRegistry *)moduleRegistry
{
  // In bridgeless mode, ABI48_0_0RCTSurfaceHostingProxyRootView is created with an ABI48_0_0RCTModuleRegistry
  if (_moduleRegistry) {
    return _moduleRegistry;
  }

  return _bridge.moduleRegistry;
}

- (id<ABI48_0_0RCTEventDispatcherProtocol>)eventDispatcher
{
  return [self.moduleRegistry moduleForName:"EventDispatcher"];
}

ABI48_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI48_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

#pragma mark proxy methods to ABI48_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ABI48_0_0ReactTag
{
  return super.surface.rootViewTag;
}

- (ABI48_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI48_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  super.sizeMeasureMode = convertToSurfaceSizeMeasureMode(sizeFlexibility);
}

- (NSDictionary *)appProperties
{
  return super.surface.properties;
}

- (void)setAppProperties:(NSDictionary *)appProperties
{
  [super.surface setProperties:appProperties];
}

- (UIView *)loadingView
{
  return super.activityIndicatorViewFactory ? super.activityIndicatorViewFactory() : nil;
}

- (void)setLoadingView:(UIView *)loadingView
{
  super.activityIndicatorViewFactory = ^UIView *(void)
  {
    return loadingView;
  };
}

#pragma mark ABI48_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI48_0_0RCTSurface *)surface didChangeStage:(ABI48_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI48_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI48_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI48_0_0RCTContentDidAppearNotification object:self];
    });
  }
}

- (void)surface:(ABI48_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI48_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ABI48_0_0ReactViewController
{
  return _ABI48_0_0ReactViewController ?: [super ABI48_0_0ReactViewController];
}

- (void)setMinimumSize:(CGSize)minimumSize
{
  if (!CGSizeEqualToSize(minimumSize, CGSizeZero)) {
    // TODO (T93859532): Investigate implementation for this.
    ABI48_0_0RCTLogError(@"ABI48_0_0RCTSurfaceHostingProxyRootView does not support changing the deprecated minimumSize");
  }
  _minimumSize = CGSizeZero;
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end
