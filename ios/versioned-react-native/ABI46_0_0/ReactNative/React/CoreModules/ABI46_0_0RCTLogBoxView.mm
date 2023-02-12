/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTLogBoxView.h"

#import <ABI46_0_0React/ABI46_0_0RCTLog.h>
#import <ABI46_0_0React/ABI46_0_0RCTSurface.h>
#import <ABI46_0_0React/ABI46_0_0RCTSurfaceHostingView.h>

@implementation ABI46_0_0RCTLogBoxView {
  ABI46_0_0RCTSurface *_surface;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.windowLevel = UIWindowLevelStatusBar - 1;
    self.backgroundColor = [UIColor clearColor];
  }
  return self;
}

- (void)createRootViewController:(UIView *)view
{
  UIViewController *_rootViewController = [UIViewController new];
  _rootViewController.view = view;
  _rootViewController.view.backgroundColor = [UIColor clearColor];
  _rootViewController.modalPresentationStyle = UIModalPresentationFullScreen;
  self.rootViewController = _rootViewController;
}

- (instancetype)initWithWindow:(UIWindow *)window bridge:(ABI46_0_0RCTBridge *)bridge
{
  ABI46_0_0RCTErrorNewArchitectureValidation(ABI46_0_0RCTNotAllowedInAppWideFabric, @"ABI46_0_0RCTLogBoxView", nil);

  if (@available(iOS 13.0, *)) {
    self = [super initWithWindowScene:window.windowScene];
  } else {
    self = [super initWithFrame:window.frame];
  }

  self.windowLevel = UIWindowLevelStatusBar - 1;
  self.backgroundColor = [UIColor clearColor];

  _surface = [[ABI46_0_0RCTSurface alloc] initWithBridge:bridge moduleName:@"LogBox" initialProperties:@{}];
  [_surface start];

  if (![_surface synchronouslyWaitForStage:ABI46_0_0RCTSurfaceStageSurfaceDidInitialMounting timeout:1]) {
    ABI46_0_0RCTLogInfo(@"Failed to mount LogBox within 1s");
  }
  [self createRootViewController:(UIView *)_surface.view];

  return self;
}

- (instancetype)initWithWindow:(UIWindow *)window surfacePresenter:(id<ABI46_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  if (@available(iOS 13.0, *)) {
    self = [super initWithWindowScene:window.windowScene];
  } else {
    self = [super initWithFrame:window.frame];
  }

  id<ABI46_0_0RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"LogBox" initialProperties:@{}];
  [surface start];
  ABI46_0_0RCTSurfaceHostingView *rootView = [[ABI46_0_0RCTSurfaceHostingView alloc]
      initWithSurface:surface
      sizeMeasureMode:ABI46_0_0RCTSurfaceSizeMeasureModeWidthExact | ABI46_0_0RCTSurfaceSizeMeasureModeHeightExact];
  [self createRootViewController:rootView];

  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [_surface setSize:self.frame.size];
}

- (void)dealloc
{
  [ABI46_0_0RCTSharedApplication().delegate.window makeKeyWindow];
}

- (void)show
{
  [self becomeFirstResponder];
  [self makeKeyAndVisible];
}

@end
