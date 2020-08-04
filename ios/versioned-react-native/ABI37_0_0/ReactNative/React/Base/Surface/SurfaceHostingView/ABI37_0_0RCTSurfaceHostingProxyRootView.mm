/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI37_0_0RCTAssert.h"
#import "ABI37_0_0RCTBridge.h"
#import "ABI37_0_0RCTLog.h"
#import "ABI37_0_0RCTPerformanceLogger.h"
#import "ABI37_0_0RCTProfile.h"
#import "ABI37_0_0RCTRootContentView.h"
#import "ABI37_0_0RCTRootViewDelegate.h"
#import "ABI37_0_0RCTSurface.h"
#import "ABI37_0_0UIView+React.h"

static ABI37_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI37_0_0RCTRootViewSizeFlexibility sizeFlexibility) {
  switch (sizeFlexibility) {
    case ABI37_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI37_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI37_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI37_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI37_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI37_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI37_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI37_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI37_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI37_0_0RCTRootViewSizeFlexibilityNone:
      return ABI37_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI37_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI37_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI37_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode) {
  switch (sizeMeasureMode) {
    case ABI37_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI37_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI37_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI37_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI37_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI37_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI37_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI37_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI37_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI37_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI37_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI37_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI37_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI37_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI37_0_0RCTAssertMainQueue();
  ABI37_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI37_0_0RCTSurfaceHostingProxyRootView");
  ABI37_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI37_0_0RCTSurfaceHostingProxyRootView");

  ABI37_0_0RCT_PROFILE_BEGIN_EVENT(ABI37_0_0RCTProfileTagAlways, @"-[ABI37_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI37_0_0RCTPLTTI];
  }

  // `ABI37_0_0RCTRootViewSizeFlexibilityNone` is the ABI37_0_0RCTRootView's default.
  ABI37_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI37_0_0RCTRootViewSizeFlexibilityNone);

  ABI37_0_0RCTSurface *surface = [[self class] createSurfaceWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
  [surface start];
  if (self = [super initWithSurface:surface sizeMeasureMode:sizeMeasureMode]) {
    self.backgroundColor = [UIColor whiteColor];
  }

  ABI37_0_0RCT_PROFILE_END_EVENT(ABI37_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI37_0_0RCTBridge *bridge = [[ABI37_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI37_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI37_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

# pragma mark proxy methods to ABI37_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ABI37_0_0ReactTag
{
  return super.surface.rootViewTag;
}

- (ABI37_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI37_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

#pragma mark ABI37_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI37_0_0RCTSurface *)surface didChangeStage:(ABI37_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI37_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI37_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI37_0_0RCTContentDidAppearNotification
                                                          object:self];
    });
  }
}

- (void)surface:(ABI37_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI37_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ABI37_0_0ReactViewController
{
  return _ABI37_0_0ReactViewController ?: [super ABI37_0_0ReactViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end

