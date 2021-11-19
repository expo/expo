//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI43_0_0EXBatteryState) {
  ABI43_0_0EXBatteryStateUnknown = 0,
  ABI43_0_0EXBatteryStateUnplugged,
  ABI43_0_0EXBatteryStateCharging,
  ABI43_0_0EXBatteryStateFull
};


@interface ABI43_0_0EXBattery : ABI43_0_0EXExportedModule <ABI43_0_0EXModuleRegistryConsumer, ABI43_0_0EXEventEmitter>

@end

NS_ASSUME_NONNULL_END
