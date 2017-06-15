/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTDeviceInfo.h"

#import "ABI18_0_0RCTAccessibilityManager.h"
#import "ABI18_0_0RCTAssert.h"
#import "ABI18_0_0RCTEventDispatcher.h"
#import "ABI18_0_0RCTUtils.h"

@implementation ABI18_0_0RCTDeviceInfo {
#if !TARGET_OS_TV
  UIInterfaceOrientation _currentInterfaceOrientation;
#endif
}

@synthesize bridge = _bridge;

ABI18_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setBridge:(ABI18_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI18_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
#if !TARGET_OS_TV
  _currentInterfaceOrientation = [ABI18_0_0RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];
#endif
}

static NSDictionary *ABI18_0_0RCTExportedDimensions(ABI18_0_0RCTBridge *bridge)
{
  ABI18_0_0RCTAssertMainQueue();

  // Don't use ABI18_0_0RCTScreenSize since it the interface orientation doesn't apply to it
  CGRect screenSize = [[UIScreen mainScreen] bounds];
  NSDictionary *dims = @{
                         @"width": @(screenSize.size.width),
                         @"height": @(screenSize.size.height),
                         @"scale": @(ABI18_0_0RCTScreenScale()),
                         @"fontScale": @(bridge.accessibilityManager.multiplier)
                         };
  return @{
           @"window": dims,
           @"screen": dims
           };
}

- (void)invalidate
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_bridge = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  });
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  constants[@"Dimensions"] = ABI18_0_0RCTExportedDimensions(_bridge);
  return constants;
}

- (void)didReceiveNewContentSizeMultiplier
{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                              body:ABI18_0_0RCTExportedDimensions(_bridge)];
#pragma clang diagnostic pop
}


- (void)interfaceOrientationDidChange
{
#if !TARGET_OS_TV
  UIInterfaceOrientation nextOrientation = [ABI18_0_0RCTSharedApplication() statusBarOrientation];

  // Update when we go from portrait to landscape, or landscape to portrait
  if ((UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation))) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                                    body:ABI18_0_0RCTExportedDimensions(_bridge)];
#pragma clang diagnostic pop
      }

  _currentInterfaceOrientation = nextOrientation;
#endif
}


@end
