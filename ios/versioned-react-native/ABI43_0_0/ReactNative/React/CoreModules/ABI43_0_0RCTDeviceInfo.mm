/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTDeviceInfo.h"

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>
#import <ABI43_0_0React/ABI43_0_0RCTAccessibilityManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTAssert.h>
#import <ABI43_0_0React/ABI43_0_0RCTConstants.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcherProtocol.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIUtils.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

#import "ABI43_0_0CoreModulesPlugins.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

@interface ABI43_0_0RCTDeviceInfo () <ABI43_0_0NativeDeviceInfoSpec>
@end

@implementation ABI43_0_0RCTDeviceInfo {
  UIInterfaceOrientation _currentInterfaceOrientation;
  NSDictionary *_currentInterfaceDimensions;
}

@synthesize bridge = _bridge;
@synthesize turboModuleRegistry = _turboModuleRegistry;

ABI43_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setBridge:(ABI43_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI43_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];

  _currentInterfaceOrientation = [ABI43_0_0RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];

  _currentInterfaceDimensions = ABI43_0_0RCTExportedDimensions(_bridge, _turboModuleRegistry);

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:ABI43_0_0RCTUserInterfaceStyleDidChangeNotification
                                             object:nil];
}

static BOOL ABI43_0_0RCTIsIPhoneX()
{
  static BOOL isIPhoneX = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    ABI43_0_0RCTAssertMainQueue();

    CGSize screenSize = [UIScreen mainScreen].nativeBounds.size;
    CGSize iPhoneXScreenSize = CGSizeMake(1125, 2436);
    CGSize iPhoneXMaxScreenSize = CGSizeMake(1242, 2688);
    CGSize iPhoneXRScreenSize = CGSizeMake(828, 1792);

    isIPhoneX = CGSizeEqualToSize(screenSize, iPhoneXScreenSize) ||
        CGSizeEqualToSize(screenSize, iPhoneXMaxScreenSize) || CGSizeEqualToSize(screenSize, iPhoneXRScreenSize);
  });

  return isIPhoneX;
}

static NSDictionary *ABI43_0_0RCTExportedDimensions(ABI43_0_0RCTBridge *bridge, id<ABI43_0_0RCTTurboModuleRegistry> turboModuleRegistry)
{
  ABI43_0_0RCTAssertMainQueue();
  ABI43_0_0RCTDimensions dimensions;
  if (bridge) {
    dimensions = ABI43_0_0RCTGetDimensions(bridge.accessibilityManager.multiplier ?: 1.0);
  } else if (turboModuleRegistry) {
    dimensions = ABI43_0_0RCTGetDimensions(
        ((ABI43_0_0RCTAccessibilityManager *)[turboModuleRegistry moduleForName:"ABI43_0_0RCTAccessibilityManager"]).multiplier ?: 1.0);
  } else {
    ABI43_0_0RCTAssert(false, @"Bridge or TurboModuleRegistry must be set to properly init dimensions.");
  }
  __typeof(dimensions.window) window = dimensions.window;
  NSDictionary<NSString *, NSNumber *> *dimsWindow = @{
    @"width" : @(window.width),
    @"height" : @(window.height),
    @"scale" : @(window.scale),
    @"fontScale" : @(window.fontScale)
  };
  __typeof(dimensions.screen) screen = dimensions.screen;
  NSDictionary<NSString *, NSNumber *> *dimsScreen = @{
    @"width" : @(screen.width),
    @"height" : @(screen.height),
    @"scale" : @(screen.scale),
    @"fontScale" : @(screen.fontScale)
  };
  return @{@"window" : dimsWindow, @"screen" : dimsScreen};
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  __block NSDictionary<NSString *, id> *constants;
  ABI43_0_0RCTUnsafeExecuteOnMainQueueSync(^{
    constants = @{
      @"Dimensions" : ABI43_0_0RCTExportedDimensions(self->_bridge, self->_turboModuleRegistry),
      // Note:
      // This prop is deprecated and will be removed in a future release.
      // Please use this only for a quick and temporary solution.
      // Use <SafeAreaView> instead.
      @"isIPhoneX_deprecated" : @(ABI43_0_0RCTIsIPhoneX()),
    };
  });

  return constants;
}

- (void)didReceiveNewContentSizeMultiplier
{
  ABI43_0_0RCTBridge *bridge = _bridge;
  ABI43_0_0RCTExecuteOnMainQueue(^{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                               body:ABI43_0_0RCTExportedDimensions(bridge, self->_turboModuleRegistry)];
#pragma clang diagnostic pop
  });
}

- (void)interfaceOrientationDidChange
{
  __weak __typeof(self) weakSelf = self;
  ABI43_0_0RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceOrientationDidChange];
  });
}

- (void)_interfaceOrientationDidChange
{
  UIInterfaceOrientation nextOrientation = [ABI43_0_0RCTSharedApplication() statusBarOrientation];

  // Update when we go from portrait to landscape, or landscape to portrait
  if ((UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation))) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions"
                                                body:ABI43_0_0RCTExportedDimensions(_bridge, _turboModuleRegistry)];
#pragma clang diagnostic pop
  }

  _currentInterfaceOrientation = nextOrientation;
}

- (void)interfaceFrameDidChange
{
  __weak __typeof(self) weakSelf = self;
  ABI43_0_0RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceFrameDidChange];
  });
}

- (void)_interfaceFrameDidChange
{
  NSDictionary *nextInterfaceDimensions = ABI43_0_0RCTExportedDimensions(_bridge, _turboModuleRegistry);

  if (!([nextInterfaceDimensions isEqual:_currentInterfaceDimensions])) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateDimensions" body:nextInterfaceDimensions];
#pragma clang diagnostic pop
  }

  _currentInterfaceDimensions = nextInterfaceDimensions;
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDeviceInfoSpecJSI>(params);
}

@end

Class ABI43_0_0RCTDeviceInfoCls(void)
{
  return ABI43_0_0RCTDeviceInfo.class;
}
