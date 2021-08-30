/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI41_0_0RCTAssert.h"
#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTLog.h"
#import "ABI41_0_0RCTPerformanceLogger.h"
#import "ABI41_0_0RCTProfile.h"
#import "ABI41_0_0RCTRootContentView.h"
#import "ABI41_0_0RCTRootViewDelegate.h"
#import "ABI41_0_0RCTSurface.h"
#import "ABI41_0_0UIView+React.h"

static ABI41_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI41_0_0RCTRootViewSizeFlexibility sizeFlexibility)
{
  switch (sizeFlexibility) {
    case ABI41_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI41_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI41_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI41_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI41_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI41_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI41_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI41_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI41_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI41_0_0RCTRootViewSizeFlexibilityNone:
      return ABI41_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI41_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI41_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI41_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode)
{
  switch (sizeMeasureMode) {
    case ABI41_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI41_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI41_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI41_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI41_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI41_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI41_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI41_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI41_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI41_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI41_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI41_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI41_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI41_0_0RCTAssertMainQueue();
  ABI41_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI41_0_0RCTSurfaceHostingProxyRootView");
  ABI41_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI41_0_0RCTSurfaceHostingProxyRootView");

  ABI41_0_0RCT_PROFILE_BEGIN_EVENT(ABI41_0_0RCTProfileTagAlways, @"-[ABI41_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI41_0_0RCTPLTTI];
  }

  // `ABI41_0_0RCTRootViewSizeFlexibilityNone` is the ABI41_0_0RCTRootView's default.
  ABI41_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI41_0_0RCTRootViewSizeFlexibilityNone);

  ABI41_0_0RCTSurface *surface = [[self class] createSurfaceWithBridge:bridge
                                                   moduleName:moduleName
                                            initialProperties:initialProperties];
  [surface start];
  if (self = [super initWithSurface:surface sizeMeasureMode:sizeMeasureMode]) {
    self.backgroundColor = [UIColor whiteColor];
  }

  ABI41_0_0RCT_PROFILE_END_EVENT(ABI41_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI41_0_0RCTBridge *bridge = [[ABI41_0_0RCTBridge alloc] initWithBundleURL:bundleURL moduleProvider:nil launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI41_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI41_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

#pragma mark proxy methods to ABI41_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ABI41_0_0ReactTag
{
  return super.surface.rootViewTag;
}

- (ABI41_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI41_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

#pragma mark ABI41_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI41_0_0RCTSurface *)surface didChangeStage:(ABI41_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI41_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI41_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI41_0_0RCTContentDidAppearNotification object:self];
    });
  }
}

- (void)surface:(ABI41_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI41_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ABI41_0_0ReactViewController
{
  return _ABI41_0_0ReactViewController ?: [super ABI41_0_0ReactViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end
