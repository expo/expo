/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI38_0_0RCTAssert.h"
#import "ABI38_0_0RCTBridge.h"
#import "ABI38_0_0RCTLog.h"
#import "ABI38_0_0RCTPerformanceLogger.h"
#import "ABI38_0_0RCTProfile.h"
#import "ABI38_0_0RCTRootContentView.h"
#import "ABI38_0_0RCTRootViewDelegate.h"
#import "ABI38_0_0RCTSurface.h"
#import "ABI38_0_0UIView+React.h"

static ABI38_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI38_0_0RCTRootViewSizeFlexibility sizeFlexibility) {
  switch (sizeFlexibility) {
    case ABI38_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI38_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI38_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI38_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI38_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI38_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI38_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI38_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI38_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI38_0_0RCTRootViewSizeFlexibilityNone:
      return ABI38_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI38_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI38_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI38_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode) {
  switch (sizeMeasureMode) {
    case ABI38_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI38_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI38_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI38_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI38_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI38_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI38_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI38_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI38_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI38_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI38_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI38_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI38_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI38_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI38_0_0RCTAssertMainQueue();
  ABI38_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI38_0_0RCTSurfaceHostingProxyRootView");
  ABI38_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI38_0_0RCTSurfaceHostingProxyRootView");

  ABI38_0_0RCT_PROFILE_BEGIN_EVENT(ABI38_0_0RCTProfileTagAlways, @"-[ABI38_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI38_0_0RCTPLTTI];
  }

  // `ABI38_0_0RCTRootViewSizeFlexibilityNone` is the ABI38_0_0RCTRootView's default.
  ABI38_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI38_0_0RCTRootViewSizeFlexibilityNone);

  ABI38_0_0RCTSurface *surface = [[self class] createSurfaceWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
  [surface start];
  if (self = [super initWithSurface:surface sizeMeasureMode:sizeMeasureMode]) {
    self.backgroundColor = [UIColor whiteColor];
  }

  ABI38_0_0RCT_PROFILE_END_EVENT(ABI38_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI38_0_0RCTBridge *bridge = [[ABI38_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI38_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI38_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

# pragma mark proxy methods to ABI38_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ABI38_0_0ReactTag
{
  return super.surface.rootViewTag;
}

- (ABI38_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI38_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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
  super.activityIndicatorViewFactory = ^UIView *(void) {
    return loadingView;
  };
}

#pragma mark ABI38_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI38_0_0RCTSurface *)surface didChangeStage:(ABI38_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI38_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI38_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI38_0_0RCTContentDidAppearNotification
                                                          object:self];
    });
  }
}

- (void)surface:(ABI38_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI38_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ABI38_0_0ReactViewController
{
  return _ABI38_0_0ReactViewController ?: [super ABI38_0_0ReactViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end

