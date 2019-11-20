/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI35_0_0RCTAssert.h"
#import "ABI35_0_0RCTBridge.h"
#import "ABI35_0_0RCTLog.h"
#import "ABI35_0_0RCTPerformanceLogger.h"
#import "ABI35_0_0RCTProfile.h"
#import "ABI35_0_0RCTRootContentView.h"
#import "ABI35_0_0RCTRootViewDelegate.h"
#import "ABI35_0_0RCTSurface.h"
#import "UIView+ReactABI35_0_0.h"

static ABI35_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI35_0_0RCTRootViewSizeFlexibility sizeFlexibility) {
  switch (sizeFlexibility) {
    case ABI35_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI35_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI35_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI35_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI35_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI35_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI35_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI35_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI35_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI35_0_0RCTRootViewSizeFlexibilityNone:
      return ABI35_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI35_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI35_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI35_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode) {
  switch (sizeMeasureMode) {
    case ABI35_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI35_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI35_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI35_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI35_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI35_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI35_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI35_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI35_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI35_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI35_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI35_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI35_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI35_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI35_0_0RCTAssertMainQueue();
  ABI35_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI35_0_0RCTSurfaceHostingProxyRootView");
  ABI35_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI35_0_0RCTSurfaceHostingProxyRootView");

  ABI35_0_0RCT_PROFILE_BEGIN_EVENT(ABI35_0_0RCTProfileTagAlways, @"-[ABI35_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI35_0_0RCTPLTTI];
  }

  // `ABI35_0_0RCTRootViewSizeFlexibilityNone` is the ABI35_0_0RCTRootView's default.
  ABI35_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI35_0_0RCTRootViewSizeFlexibilityNone);

  if (self = [super initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties sizeMeasureMode:sizeMeasureMode]) {
    self.backgroundColor = [UIColor whiteColor];
    [super.surface start];
  }

  ABI35_0_0RCT_PROFILE_END_EVENT(ABI35_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI35_0_0RCTBridge *bridge = [[ABI35_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI35_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI35_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

# pragma mark proxy methods to ABI35_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ReactABI35_0_0Tag
{
  return super.surface.rootViewTag;
}

- (ABI35_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI35_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

#pragma mark ABI35_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI35_0_0RCTSurface *)surface didChangeStage:(ABI35_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI35_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI35_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI35_0_0RCTContentDidAppearNotification
                                                          object:self];
    });
  }
}

- (void)surface:(ABI35_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI35_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ReactABI35_0_0ViewController
{
  return _ReactABI35_0_0ViewController ?: [super ReactABI35_0_0ViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end

