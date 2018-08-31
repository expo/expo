/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI30_0_0RCTAssert.h"
#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTPerformanceLogger.h"
#import "ABI30_0_0RCTProfile.h"
#import "ABI30_0_0RCTRootContentView.h"
#import "ABI30_0_0RCTRootViewDelegate.h"
#import "ABI30_0_0RCTSurface.h"
#import "UIView+ReactABI30_0_0.h"

static ABI30_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI30_0_0RCTRootViewSizeFlexibility sizeFlexibility) {
  switch (sizeFlexibility) {
    case ABI30_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI30_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI30_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI30_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI30_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI30_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI30_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI30_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI30_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI30_0_0RCTRootViewSizeFlexibilityNone:
      return ABI30_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI30_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI30_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI30_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode) {
  switch (sizeMeasureMode) {
    case ABI30_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI30_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI30_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI30_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI30_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI30_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI30_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI30_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI30_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI30_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI30_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI30_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI30_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI30_0_0RCTAssertMainQueue();
  ABI30_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI30_0_0RCTSurfaceHostingProxyRootView");
  ABI30_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI30_0_0RCTSurfaceHostingProxyRootView");

  ABI30_0_0RCT_PROFILE_BEGIN_EVENT(ABI30_0_0RCTProfileTagAlways, @"-[ABI30_0_0RCTSurfaceHostingProxyRootView init]", nil);
  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI30_0_0RCTPLTTI];
  }

  if (self = [super initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties]) {
    self.backgroundColor = [UIColor whiteColor];
  }

  ABI30_0_0RCT_PROFILE_END_EVENT(ABI30_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI30_0_0RCTBridge *bridge = [[ABI30_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

# pragma mark proxy methods to ABI30_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (ABI30_0_0RCTBridge *)bridge
{
  return super.surface.bridge;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ReactABI30_0_0Tag
{
  return super.surface.rootViewTag;
}

- (ABI30_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI30_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

- (CGSize)intrinsicContentSize
{
  return super.surface.intrinsicSize;
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

#pragma mark ABI30_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI30_0_0RCTSurface *)surface didChangeStage:(ABI30_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI30_0_0RCTSurfaceStageIsRunning(stage)) {
    [super.surface.bridge.performanceLogger markStopForTag:ABI30_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI30_0_0RCTContentDidAppearNotification
                                                          object:self];
    });
  }
}

- (void)surface:(ABI30_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI30_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ReactABI30_0_0ViewController
{
  return _ReactABI30_0_0ViewController ?: [super ReactABI30_0_0ViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end

