//  Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <UMCore/UMEventEmitter.h>
#import <UMCore/UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, EXBatteryState) {
  EXBatteryStateUnknown = 0,
  EXBatteryStateUnplugged,
  EXBatteryStateCharging,
  EXBatteryStateFull
};


@interface EXBattery : UMExportedModule <UMModuleRegistryConsumer, UMEventEmitter>

@end

NS_ASSUME_NONNULL_END
