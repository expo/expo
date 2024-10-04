/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponent.h>

typedef CKComponent *(^ABI42_0_0RCTSurfaceHostingComponentOptionsActivityIndicatorComponentFactory)();

struct ABI42_0_0RCTSurfaceHostingComponentOptions {
  NSTimeInterval synchronousLayoutingTimeout = 0.350;
  BOOL synchronousStateUpdates = YES;
  CGSize activityIndicatorSize = {44.0, 44.0};
  BOOL boundsAnimations = YES;
  ABI42_0_0RCTSurfaceHostingComponentOptionsActivityIndicatorComponentFactory activityIndicatorComponentFactory = nil;
};
