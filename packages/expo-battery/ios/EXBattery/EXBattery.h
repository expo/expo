//  Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, EXBatteryState) {
  EXBatteryStateUnknown = 0,
  EXBatteryStateUnplugged,
  EXBatteryStateCharging,
  EXBatteryStateFull
};


@interface EXBattery : EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@end

NS_ASSUME_NONNULL_END
