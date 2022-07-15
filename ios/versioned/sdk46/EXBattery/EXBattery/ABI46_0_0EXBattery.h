//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI46_0_0EXBatteryState) {
  ABI46_0_0EXBatteryStateUnknown = 0,
  ABI46_0_0EXBatteryStateUnplugged,
  ABI46_0_0EXBatteryStateCharging,
  ABI46_0_0EXBatteryStateFull
};


@interface ABI46_0_0EXBattery : ABI46_0_0EXExportedModule <ABI46_0_0EXModuleRegistryConsumer, ABI46_0_0EXEventEmitter>

@end

NS_ASSUME_NONNULL_END
