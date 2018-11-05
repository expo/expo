/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI29_0_0RCTAssert.h"
#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTLog.h"
#import "ABI29_0_0RCTPerformanceLogger.h"
#import "ABI29_0_0RCTProfile.h"
#import "ABI29_0_0RCTRootContentView.h"
#import "ABI29_0_0RCTRootViewDelegate.h"
#import "ABI29_0_0RCTSurface.h"
#import "UIView+ReactABI29_0_0.h"

static ABI29_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI29_0_0RCTRootViewSizeFlexibility sizeFlexibility) {
  switch (sizeFlexibility) {
    case ABI29_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI29_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI29_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI29_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI29_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI29_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI29_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI29_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI29_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI29_0_0RCTRootViewSizeFlexibilityNone:
      return ABI29_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI29_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI29_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI29_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode) {
  switch (sizeMeasureMode) {
    case ABI29_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI29_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI29_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI29_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI29_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI29_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI29_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI29_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI29_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI29_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI29_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI29_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI29_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI29_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI29_0_0RCTAssertMainQueue();
  ABI29_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI29_0_0RCTSurfaceHostingProxyRootView");
  ABI29_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI29_0_0RCTSurfaceHostingProxyRootView");

  ABI29_0_0RCT_PROFILE_BEGIN_EVENT(ABI29_0_0RCTProfileTagAlways, @"-[ABI29_0_0RCTSurfaceHostingProxyRootView init]", nil);
  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI29_0_0RCTPLTTI];
  }

  if (self = [super initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties]) {
    self.backgroundColor = [UIColor whiteColor];
  }

  ABI29_0_0RCT_PROFILE_END_EVENT(ABI29_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI29_0_0RCTBridge *bridge = [[ABI29_0_0RCTBridge alloc] initWithBundleURL:bundleURL
                                            moduleProvider:nil
                                             launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI29_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI29_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

# pragma mark proxy methods to ABI29_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (ABI29_0_0RCTBridge *)bridge
{
  return super.surface.bridge;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ReactABI29_0_0Tag
{
  return super.surface.rootViewTag;
}

- (ABI29_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI29_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

#pragma mark ABI29_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI29_0_0RCTSurface *)surface didChangeStage:(ABI29_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI29_0_0RCTSurfaceStageIsRunning(stage)) {
    [super.surface.bridge.performanceLogger markStopForTag:ABI29_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI29_0_0RCTContentDidAppearNotification
                                                          object:self];
    });
  }
}

- (void)surface:(ABI29_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI29_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ReactABI29_0_0ViewController
{
  return _ReactABI29_0_0ViewController ?: [super ReactABI29_0_0ViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end

