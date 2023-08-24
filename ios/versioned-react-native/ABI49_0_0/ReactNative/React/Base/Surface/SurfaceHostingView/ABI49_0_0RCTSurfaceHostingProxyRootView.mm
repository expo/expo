/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI49_0_0RCTAssert.h"
#import "ABI49_0_0RCTBridge+Private.h"
#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTLog.h"
#import "ABI49_0_0RCTPerformanceLogger.h"
#import "ABI49_0_0RCTProfile.h"
#import "ABI49_0_0RCTRootContentView.h"
#import "ABI49_0_0RCTRootViewDelegate.h"
#import "ABI49_0_0RCTSurface.h"
#import "ABI49_0_0UIView+React.h"

static ABI49_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI49_0_0RCTRootViewSizeFlexibility sizeFlexibility)
{
  switch (sizeFlexibility) {
    case ABI49_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI49_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI49_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI49_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI49_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI49_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI49_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI49_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI49_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI49_0_0RCTRootViewSizeFlexibilityNone:
      return ABI49_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI49_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI49_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI49_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode)
{
  switch (sizeMeasureMode) {
    case ABI49_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI49_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI49_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI49_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI49_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI49_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI49_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI49_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI49_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI49_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI49_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI49_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI49_0_0RCTSurfaceHostingProxyRootView {
  ABI49_0_0RCTModuleRegistry *_moduleRegistry;
}

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI49_0_0RCTAssertMainQueue();
  ABI49_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI49_0_0RCTSurfaceHostingProxyRootView");
  ABI49_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI49_0_0RCTSurfaceHostingProxyRootView");

  ABI49_0_0RCT_PROFILE_BEGIN_EVENT(ABI49_0_0RCTProfileTagAlways, @"-[ABI49_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;
  _minimumSize = CGSizeZero;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI49_0_0RCTPLTTI];
  }

  // `ABI49_0_0RCTRootViewSizeFlexibilityNone` is the ABI49_0_0RCTRootView's default.
  ABI49_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI49_0_0RCTRootViewSizeFlexibilityNone);

  self = [super initWithBridge:bridge
                    moduleName:moduleName
             initialProperties:initialProperties
               sizeMeasureMode:sizeMeasureMode];

  ABI49_0_0RCT_PROFILE_END_EVENT(ABI49_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI49_0_0RCTBridge *bridge = [[ABI49_0_0RCTBridge alloc] initWithBundleURL:bundleURL moduleProvider:nil launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

- (instancetype)initWithSurface:(id<ABI49_0_0RCTSurfaceProtocol>)surface
                sizeMeasureMode:(ABI49_0_0RCTSurfaceSizeMeasureMode)sizeMeasureMode
                 moduleRegistry:(ABI49_0_0RCTModuleRegistry *)moduleRegistry
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

- (ABI49_0_0RCTModuleRegistry *)moduleRegistry
{
  // In bridgeless mode, ABI49_0_0RCTSurfaceHostingProxyRootView is created with an ABI49_0_0RCTModuleRegistry
  if (_moduleRegistry) {
    return _moduleRegistry;
  }

  return _bridge.moduleRegistry;
}

- (id<ABI49_0_0RCTEventDispatcherProtocol>)eventDispatcher
{
  return [self.moduleRegistry moduleForName:"EventDispatcher"];
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

#pragma mark proxy methods to ABI49_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ABI49_0_0ReactTag
{
  return super.surface.rootViewTag;
}

- (ABI49_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI49_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

#pragma mark ABI49_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI49_0_0RCTSurface *)surface didChangeStage:(ABI49_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI49_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI49_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI49_0_0RCTContentDidAppearNotification object:self];
    });
  }
}

- (void)surface:(ABI49_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI49_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ABI49_0_0ReactViewController
{
  return _ABI49_0_0ReactViewController ?: [super ABI49_0_0ReactViewController];
}

- (void)setMinimumSize:(CGSize)minimumSize
{
  if (!CGSizeEqualToSize(minimumSize, CGSizeZero)) {
    // TODO (T93859532): Investigate implementation for this.
    ABI49_0_0RCTLogError(@"ABI49_0_0RCTSurfaceHostingProxyRootView does not support changing the deprecated minimumSize");
  }
  _minimumSize = CGSizeZero;
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end
