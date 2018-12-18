/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI32_0_0RCTAssert.h"
#import "ABI32_0_0RCTBridge.h"
#import "ABI32_0_0RCTLog.h"
#import "ABI32_0_0RCTPerformanceLogger.h"
#import "ABI32_0_0RCTProfile.h"
#import "ABI32_0_0RCTRootContentView.h"
#import "ABI32_0_0RCTRootViewDelegate.h"
#import "ABI32_0_0RCTSurface.h"
#import "UIView+ReactABI32_0_0.h"

static ABI32_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI32_0_0RCTRootViewSizeFlexibility sizeFlexibility) {
  switch (sizeFlexibility) {
    case ABI32_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI32_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI32_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI32_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI32_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI32_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI32_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI32_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI32_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI32_0_0RCTRootViewSizeFlexibilityNone:
      return ABI32_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI32_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI32_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI32_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode) {
  switch (sizeMeasureMode) {
    case ABI32_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI32_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI32_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI32_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI32_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI32_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI32_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI32_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI32_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI32_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI32_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI32_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI32_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI32_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI32_0_0RCTAssertMainQueue();
  ABI32_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI32_0_0RCTSurfaceHostingProxyRootView");
  ABI32_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI32_0_0RCTSurfaceHostingProxyRootView");

  ABI32_0_0RCT_PROFILE_BEGIN_EVENT(ABI32_0_0RCTProfileTagAlways, @"-[ABI32_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI32_0_0RCTPLTTI];
  }

  // `ABI32_0_0RCTRootViewSizeFlexibilityNone` is the ABI32_0_0RCTRootView's default.
  ABI32_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI32_0_0RCTRootViewSizeFlexibilityNone);

  if (self = [super initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties sizeMeasureMode:sizeMeasureMode]) {
    self.backgroundColor = [UIColor whiteColor];
  }

  ABI32_0_0RCT_PROFILE_END_EVENT(ABI32_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI32_0_0RCTBridge *bridge = [[ABI32_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI32_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI32_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

# pragma mark proxy methods to ABI32_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ReactABI32_0_0Tag
{
  return super.surface.rootViewTag;
}

- (ABI32_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI32_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

#pragma mark ABI32_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI32_0_0RCTSurface *)surface didChangeStage:(ABI32_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI32_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI32_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI32_0_0RCTContentDidAppearNotification
                                                          object:self];
    });
  }
}

- (void)surface:(ABI32_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI32_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ReactABI32_0_0ViewController
{
  return _ReactABI32_0_0ViewController ?: [super ReactABI32_0_0ViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end

