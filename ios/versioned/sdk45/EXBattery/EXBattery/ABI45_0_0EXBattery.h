//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI45_0_0EXBatteryState) {
  ABI45_0_0EXBatteryStateUnknown = 0,
  ABI45_0_0EXBatteryStateUnplugged,
  ABI45_0_0EXBatteryStateCharging,
  ABI45_0_0EXBatteryStateFull
};


@interface ABI45_0_0EXBattery : ABI45_0_0EXExportedModule <ABI45_0_0EXModuleRegistryConsumer, ABI45_0_0EXEventEmitter>

@end

NS_ASSUME_NONNULL_END
