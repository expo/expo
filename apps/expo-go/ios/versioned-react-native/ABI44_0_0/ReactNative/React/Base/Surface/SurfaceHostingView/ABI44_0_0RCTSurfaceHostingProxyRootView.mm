/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTSurfaceHostingProxyRootView.h"

#import <objc/runtime.h>

#import "ABI44_0_0RCTAssert.h"
#import "ABI44_0_0RCTBridge.h"
#import "ABI44_0_0RCTLog.h"
#import "ABI44_0_0RCTPerformanceLogger.h"
#import "ABI44_0_0RCTProfile.h"
#import "ABI44_0_0RCTRootContentView.h"
#import "ABI44_0_0RCTRootViewDelegate.h"
#import "ABI44_0_0RCTSurface.h"
#import "ABI44_0_0UIView+React.h"

static ABI44_0_0RCTSurfaceSizeMeasureMode convertToSurfaceSizeMeasureMode(ABI44_0_0RCTRootViewSizeFlexibility sizeFlexibility)
{
  switch (sizeFlexibility) {
    case ABI44_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      return ABI44_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI44_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI44_0_0RCTRootViewSizeFlexibilityWidth:
      return ABI44_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI44_0_0RCTSurfaceSizeMeasureModeHeightExact;
    case ABI44_0_0RCTRootViewSizeFlexibilityHeight:
      return ABI44_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI44_0_0RCTSurfaceSizeMeasureModeHeightUndefined;
    case ABI44_0_0RCTRootViewSizeFlexibilityNone:
      return ABI44_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI44_0_0RCTSurfaceSizeMeasureModeHeightExact;
  }
}

static ABI44_0_0RCTRootViewSizeFlexibility convertToRootViewSizeFlexibility(ABI44_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode)
{
  switch (sizeMeasureMode) {
    case ABI44_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI44_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI44_0_0RCTRootViewSizeFlexibilityWidthAndHeight;
    case ABI44_0_0RCTSurfaceSizeMeasureModeWidthUndefined | ABI44_0_0RCTSurfaceSizeMeasureModeHeightExact:
      return ABI44_0_0RCTRootViewSizeFlexibilityWidth;
    case ABI44_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI44_0_0RCTSurfaceSizeMeasureModeHeightUndefined:
      return ABI44_0_0RCTRootViewSizeFlexibilityHeight;
    case ABI44_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI44_0_0RCTSurfaceSizeMeasureModeHeightExact:
    default:
      return ABI44_0_0RCTRootViewSizeFlexibilityNone;
  }
}

@implementation ABI44_0_0RCTSurfaceHostingProxyRootView

- (instancetype)initWithBridge:(ABI44_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  ABI44_0_0RCTAssertMainQueue();
  ABI44_0_0RCTAssert(bridge, @"A bridge instance is required to create an ABI44_0_0RCTSurfaceHostingProxyRootView");
  ABI44_0_0RCTAssert(moduleName, @"A moduleName is required to create an ABI44_0_0RCTSurfaceHostingProxyRootView");

  ABI44_0_0RCT_PROFILE_BEGIN_EVENT(ABI44_0_0RCTProfileTagAlways, @"-[ABI44_0_0RCTSurfaceHostingProxyRootView init]", nil);

  _bridge = bridge;

  if (!bridge.isLoading) {
    [bridge.performanceLogger markStartForTag:ABI44_0_0RCTPLTTI];
  }

  // `ABI44_0_0RCTRootViewSizeFlexibilityNone` is the ABI44_0_0RCTRootView's default.
  ABI44_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode = convertToSurfaceSizeMeasureMode(ABI44_0_0RCTRootViewSizeFlexibilityNone);

  id<ABI44_0_0RCTSurfaceProtocol> surface = [[self class] createSurfaceWithBridge:bridge
                                                              moduleName:moduleName
                                                       initialProperties:initialProperties];
  [surface start];
  if (self = [super initWithSurface:surface sizeMeasureMode:sizeMeasureMode]) {
    self.backgroundColor = [UIColor whiteColor];
  }

  ABI44_0_0RCT_PROFILE_END_EVENT(ABI44_0_0RCTProfileTagAlways, @"");

  return self;
}

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(NSDictionary *)initialProperties
                    launchOptions:(NSDictionary *)launchOptions
{
  ABI44_0_0RCTBridge *bridge = [[ABI44_0_0RCTBridge alloc] initWithBundleURL:bundleURL moduleProvider:nil launchOptions:launchOptions];

  return [self initWithBridge:bridge moduleName:moduleName initialProperties:initialProperties];
}

ABI44_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithFrame : (CGRect)frame)
ABI44_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

#pragma mark proxy methods to ABI44_0_0RCTSurfaceHostingView

- (NSString *)moduleName
{
  return super.surface.moduleName;
}

- (UIView *)contentView
{
  return self;
}

- (NSNumber *)ABI44_0_0ReactTag
{
  return super.surface.rootViewTag;
}

- (ABI44_0_0RCTRootViewSizeFlexibility)sizeFlexibility
{
  return convertToRootViewSizeFlexibility(super.sizeMeasureMode);
}

- (void)setSizeFlexibility:(ABI44_0_0RCTRootViewSizeFlexibility)sizeFlexibility
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

#pragma mark ABI44_0_0RCTSurfaceDelegate proxying

- (void)surface:(ABI44_0_0RCTSurface *)surface didChangeStage:(ABI44_0_0RCTSurfaceStage)stage
{
  [super surface:surface didChangeStage:stage];
  if (ABI44_0_0RCTSurfaceStageIsRunning(stage)) {
    [_bridge.performanceLogger markStopForTag:ABI44_0_0RCTPLTTI];
    dispatch_async(dispatch_get_main_queue(), ^{
      [[NSNotificationCenter defaultCenter] postNotificationName:ABI44_0_0RCTContentDidAppearNotification object:self];
    });
  }
}

- (void)surface:(ABI44_0_0RCTSurface *)surface didChangeIntrinsicSize:(CGSize)intrinsicSize
{
  [super surface:surface didChangeIntrinsicSize:intrinsicSize];

  [_delegate rootViewDidChangeIntrinsicSize:(ABI44_0_0RCTRootView *)self];
}

#pragma mark legacy

- (UIViewController *)ABI44_0_0ReactViewController
{
  return _ABI44_0_0ReactViewController ?: [super ABI44_0_0ReactViewController];
}

#pragma mark unsupported

- (void)cancelTouches
{
  // Not supported.
}

@end
