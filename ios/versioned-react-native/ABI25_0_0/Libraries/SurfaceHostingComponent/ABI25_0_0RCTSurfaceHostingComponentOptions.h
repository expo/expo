/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ComponentKit/CKComponent.h>

typedef CKComponent *(^ABI25_0_0RCTSurfaceHostingComponentOptionsActivityIndicatorComponentFactory)();

struct ABI25_0_0RCTSurfaceHostingComponentOptions {
  NSTimeInterval synchronousLayoutingTimeout = 0.350;
  BOOL synchronousStateUpdates = YES;
  CGSize activityIndicatorSize = {44.0, 44.0};
  BOOL boundsAnimations = YES;
  ABI25_0_0RCTSurfaceHostingComponentOptionsActivityIndicatorComponentFactory activityIndicatorComponentFactory = nil;
};
