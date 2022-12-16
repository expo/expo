/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTDeviceInfo.h"

#import <ABI46_0_0FBReactNativeSpec/ABI46_0_0FBReactNativeSpec.h>
#import <ABI46_0_0React/ABI46_0_0RCTAccessibilityManager.h>
#import <ABI46_0_0React/ABI46_0_0RCTAssert.h>
#import <ABI46_0_0React/ABI46_0_0RCTConstants.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventDispatcherProtocol.h>
#import <ABI46_0_0React/ABI46_0_0RCTInitializing.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIUtils.h>
#import <ABI46_0_0React/ABI46_0_0RCTUtils.h>

#import "ABI46_0_0CoreModulesPlugins.h"

using namespace ABI46_0_0facebook::ABI46_0_0React;

@interface ABI46_0_0RCTDeviceInfo () <ABI46_0_0NativeDeviceInfoSpec, ABI46_0_0RCTInitializing>
@end

@implementation ABI46_0_0RCTDeviceInfo {
  UIInterfaceOrientation _currentInterfaceOrientation;
  NSDictionary *_currentInterfaceDimensions;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;

ABI46_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)initialize
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:ABI46_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:[_moduleRegistry moduleForName:"AccessibilityManager"]];

  _currentInterfaceOrientation = [ABI46_0_0RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];

  _currentInterfaceDimensions = ABI46_0_0RCTExportedDimensions(_moduleRegistry, _bridge);

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:ABI46_0_0RCTUserInterfaceStyleDidChangeNotification
                                             object:nil];
}

static BOOL ABI46_0_0RCTIsIPhoneX()
{
  static BOOL isIPhoneX = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    ABI46_0_0RCTAssertMainQueue();

    CGSize screenSize = [UIScreen mainScreen].nativeBounds.size;
    CGSize iPhoneXScreenSize = CGSizeMake(1125, 2436);
    CGSize iPhoneXMaxScreenSize = CGSizeMake(1242, 2688);
    CGSize iPhoneXRScreenSize = CGSizeMake(828, 1792);
    CGSize iPhone12ScreenSize = CGSizeMake(1170, 2532);
    CGSize iPhone12MiniScreenSize = CGSizeMake(1080, 2340);
    CGSize iPhone12ProMaxScreenSize = CGSizeMake(1284, 2778);

    isIPhoneX = CGSizeEqualToSize(screenSize, iPhoneXScreenSize) ||
        CGSizeEqualToSize(screenSize, iPhoneXMaxScreenSize) || CGSizeEqualToSize(screenSize, iPhoneXRScreenSize) ||
        CGSizeEqualToSize(screenSize, iPhone12ScreenSize) || CGSizeEqualToSize(screenSize, iPhone12MiniScreenSize) ||
        CGSizeEqualToSize(screenSize, iPhone12ProMaxScreenSize);
    ;
  });

  return isIPhoneX;
}

static NSDictionary *ABI46_0_0RCTExportedDimensions(ABI46_0_0RCTModuleRegistry *moduleRegistry, ABI46_0_0RCTBridge *bridge)
{
  ABI46_0_0RCTAssertMainQueue();
  ABI46_0_0RCTDimensions dimensions;
  if (moduleRegistry) {
    ABI46_0_0RCTAccessibilityManager *accessibilityManager =
        (ABI46_0_0RCTAccessibilityManager *)[moduleRegistry moduleForName:"AccessibilityManager"];
    dimensions = ABI46_0_0RCTGetDimensions(accessibilityManager ? accessibilityManager.multiplier : 1.0);
  } else {
    ABI46_0_0RCTAssert(false, @"ModuleRegistry must be set to properly init dimensions. Bridge exists: %d", bridge != nil);
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
  ABI46_0_0RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  ABI46_0_0RCTBridge *bridge = _bridge;
  ABI46_0_0RCTUnsafeExecuteOnMainQueueSync(^{
    constants = @{
      @"Dimensions" : ABI46_0_0RCTExportedDimensions(moduleRegistry, bridge),
      // Note:
      // This prop is deprecated and will be removed in a future release.
      // Please use this only for a quick and temporary solution.
      // Use <SafeAreaView> instead.
      @"isIPhoneX_deprecated" : @(ABI46_0_0RCTIsIPhoneX()),
    };
  });

  return constants;
}

- (void)didReceiveNewContentSizeMultiplier
{
  ABI46_0_0RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  ABI46_0_0RCTBridge *bridge = _bridge;
  ABI46_0_0RCTExecuteOnMainQueue(^{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[moduleRegistry moduleForName:"EventDispatcher"]
        sendDeviceEventWithName:@"didUpdateDimensions"
                           body:ABI46_0_0RCTExportedDimensions(moduleRegistry, bridge)];
#pragma clang diagnostic pop
  });
}

- (void)interfaceOrientationDidChange
{
  __weak __typeof(self) weakSelf = self;
  ABI46_0_0RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceOrientationDidChange];
  });
}

- (void)_interfaceOrientationDidChange
{
  UIInterfaceOrientation nextOrientation = [ABI46_0_0RCTSharedApplication() statusBarOrientation];

  // Update when we go from portrait to landscape, or landscape to portrait
  if ((UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation))) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"]
        sendDeviceEventWithName:@"didUpdateDimensions"
                           body:ABI46_0_0RCTExportedDimensions(_moduleRegistry, _bridge)];
#pragma clang diagnostic pop
  }

  _currentInterfaceOrientation = nextOrientation;
}

- (void)interfaceFrameDidChange
{
  __weak __typeof(self) weakSelf = self;
  ABI46_0_0RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceFrameDidChange];
  });
}

- (void)_interfaceFrameDidChange
{
  NSDictionary *nextInterfaceDimensions = ABI46_0_0RCTExportedDimensions(_moduleRegistry, _bridge);

  if (!([nextInterfaceDimensions isEqual:_currentInterfaceDimensions])) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                          body:nextInterfaceDimensions];
#pragma clang diagnostic pop
  }

  _currentInterfaceDimensions = nextInterfaceDimensions;
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDeviceInfoSpecJSI>(params);
}

@end

Class ABI46_0_0RCTDeviceInfoCls(void)
{
  return ABI46_0_0RCTDeviceInfo.class;
}
