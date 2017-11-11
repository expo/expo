/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTDeviceInfo.h"

#import "ABI23_0_0RCTAccessibilityManager.h"
#import "ABI23_0_0RCTAssert.h"
#import "ABI23_0_0RCTEventDispatcher.h"
#import "ABI23_0_0RCTUtils.h"

@implementation ABI23_0_0RCTDeviceInfo {
#if !TARGET_OS_TV
  UIInterfaceOrientation _currentInterfaceOrientation;
#endif
}

@synthesize bridge = _bridge;

ABI23_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setBridge:(ABI23_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI23_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
#if !TARGET_OS_TV
  _currentInterfaceOrientation = [ABI23_0_0RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];
#endif
}

static BOOL ABI23_0_0RCTIsIPhoneX() {
  static BOOL isIPhoneX = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    ABI23_0_0RCTAssertMainQueue();

    isIPhoneX = CGSizeEqualToSize(
      [UIScreen mainScreen].nativeBounds.size,
      CGSizeMake(1125, 2436)
    );
  });

  return isIPhoneX;
}

static NSDictionary *ABI23_0_0RCTExportedDimensions(ABI23_0_0RCTBridge *bridge)
{
  ABI23_0_0RCTAssertMainQueue();

  // Don't use ABI23_0_0RCTScreenSize since it the interface orientation doesn't apply to it
  CGRect screenSize = [[UIScreen mainScreen] bounds];
  NSDictionary *dims = @{
                         @"width": @(screenSize.size.width),
                         @"height": @(screenSize.size.height),
                         @"scale": @(ABI23_0_0RCTScreenScale()),
                         @"fontScale": @(bridge.accessibilityManager.multiplier)
                         };
  return @{
           @"window": dims,
           @"screen": dims
           };
}

- (void)invalidate
{
  ABI23_0_0RCTExecuteOnMainQueue(^{
    self->_bridge = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  });
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{
    @"Dimensions": ABI23_0_0RCTExportedDimensions(_bridge),
    // Note:
    // This prop is deprecated and will be removed right after June 01, 2018.
    // Please use this only for a quick and temporary solution.
    // Use <SafeAreaView> instead.
    @"isIPhoneX_deprecated": @(ABI23_0_0RCTIsIPhoneX()),
  };
}

- (void)didReceiveNewContentSizeMultiplier
{
  ABI23_0_0RCTBridge *bridge = _bridge;
  ABI23_0_0RCTExecuteOnMainQueue(^{
    // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                        body:ABI23_0_0RCTExportedDimensions(bridge)];
#pragma clang diagnostic pop
  });
}

#if !TARGET_OS_TV

- (void)interfaceOrientationDidChange
{
  __weak typeof(self) weakSelf = self;
  ABI23_0_0RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceOrientationDidChange];
  });
}


- (void)_interfaceOrientationDidChange
{
  UIInterfaceOrientation nextOrientation = [ABI23_0_0RCTSharedApplication() statusBarOrientation];

  // Update when we go from portrait to landscape, or landscape to portrait
  if ((UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation))) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
        [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                                    body:ABI23_0_0RCTExportedDimensions(_bridge)];
#pragma clang diagnostic pop
      }

  _currentInterfaceOrientation = nextOrientation;
}

#endif // TARGET_OS_TV


@end
