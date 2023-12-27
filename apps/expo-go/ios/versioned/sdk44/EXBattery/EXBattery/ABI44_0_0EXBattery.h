//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI44_0_0EXBatteryState) {
  ABI44_0_0EXBatteryStateUnknown = 0,
  ABI44_0_0EXBatteryStateUnplugged,
  ABI44_0_0EXBatteryStateCharging,
  ABI44_0_0EXBatteryStateFull
};


@interface ABI44_0_0EXBattery : ABI44_0_0EXExportedModule <ABI44_0_0EXModuleRegistryConsumer, ABI44_0_0EXEventEmitter>

@end

NS_ASSUME_NONNULL_END
