/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTDeviceInfo.h"

#import <ABI45_0_0FBReactNativeSpec/ABI45_0_0FBReactNativeSpec.h>
#import <ABI45_0_0React/ABI45_0_0RCTAccessibilityManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTAssert.h>
#import <ABI45_0_0React/ABI45_0_0RCTConstants.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcherProtocol.h>
#import <ABI45_0_0React/ABI45_0_0RCTInitializing.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIUtils.h>
#import <ABI45_0_0React/ABI45_0_0RCTUtils.h>

#import "ABI45_0_0CoreModulesPlugins.h"

using namespace ABI45_0_0facebook::ABI45_0_0React;

@interface ABI45_0_0RCTDeviceInfo () <ABI45_0_0NativeDeviceInfoSpec, ABI45_0_0RCTInitializing>
@end

@implementation ABI45_0_0RCTDeviceInfo {
  UIInterfaceOrientation _currentInterfaceOrientation;
  NSDictionary *_currentInterfaceDimensions;
}

@synthesize moduleRegistry = _moduleRegistry;

ABI45_0_0RCT_EXPORT_MODULE()

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
                                               name:ABI45_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:[_moduleRegistry moduleForName:"AccessibilityManager"]];

  _currentInterfaceOrientation = [ABI45_0_0RCTSharedApplication() statusBarOrientation];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceOrientationDidChange)
                                               name:UIApplicationDidChangeStatusBarOrientationNotification
                                             object:nil];

  _currentInterfaceDimensions = ABI45_0_0RCTExportedDimensions(_moduleRegistry);

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:UIApplicationDidBecomeActiveNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(interfaceFrameDidChange)
                                               name:ABI45_0_0RCTUserInterfaceStyleDidChangeNotification
                                             object:nil];
}

static BOOL ABI45_0_0RCTIsIPhoneX()
{
  static BOOL isIPhoneX = NO;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    ABI45_0_0RCTAssertMainQueue();

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

static NSDictionary *ABI45_0_0RCTExportedDimensions(ABI45_0_0RCTModuleRegistry *moduleRegistry)
{
  ABI45_0_0RCTAssertMainQueue();
  ABI45_0_0RCTDimensions dimensions;
  if (moduleRegistry) {
    dimensions = ABI45_0_0RCTGetDimensions(
        ((ABI45_0_0RCTAccessibilityManager *)[moduleRegistry moduleForName:"AccessibilityManager"]).multiplier ?: 1.0);
  } else {
    ABI45_0_0RCTAssert(false, @"ModuleRegistry must be set to properly init dimensions.");
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
  ABI45_0_0RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  ABI45_0_0RCTUnsafeExecuteOnMainQueueSync(^{
    constants = @{
      @"Dimensions" : ABI45_0_0RCTExportedDimensions(moduleRegistry),
      // Note:
      // This prop is deprecated and will be removed in a future release.
      // Please use this only for a quick and temporary solution.
      // Use <SafeAreaView> instead.
      @"isIPhoneX_deprecated" : @(ABI45_0_0RCTIsIPhoneX()),
    };
  });

  return constants;
}

- (void)didReceiveNewContentSizeMultiplier
{
  ABI45_0_0RCTModuleRegistry *moduleRegistry = _moduleRegistry;
  ABI45_0_0RCTExecuteOnMainQueue(^{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                         body:ABI45_0_0RCTExportedDimensions(moduleRegistry)];
#pragma clang diagnostic pop
  });
}

- (void)interfaceOrientationDidChange
{
  __weak __typeof(self) weakSelf = self;
  ABI45_0_0RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceOrientationDidChange];
  });
}

- (void)_interfaceOrientationDidChange
{
  UIInterfaceOrientation nextOrientation = [ABI45_0_0RCTSharedApplication() statusBarOrientation];

  // Update when we go from portrait to landscape, or landscape to portrait
  if ((UIInterfaceOrientationIsPortrait(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsPortrait(nextOrientation)) ||
      (UIInterfaceOrientationIsLandscape(_currentInterfaceOrientation) &&
       !UIInterfaceOrientationIsLandscape(nextOrientation))) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"didUpdateDimensions"
                                                                          body:ABI45_0_0RCTExportedDimensions(_moduleRegistry)];
#pragma clang diagnostic pop
  }

  _currentInterfaceOrientation = nextOrientation;
}

- (void)interfaceFrameDidChange
{
  __weak __typeof(self) weakSelf = self;
  ABI45_0_0RCTExecuteOnMainQueue(^{
    [weakSelf _interfaceFrameDidChange];
  });
}

- (void)_interfaceFrameDidChange
{
  NSDictionary *nextInterfaceDimensions = ABI45_0_0RCTExportedDimensions(_moduleRegistry);

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

Class ABI45_0_0RCTDeviceInfoCls(void)
{
  return ABI45_0_0RCTDeviceInfo.class;
}
