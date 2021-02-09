//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI40_0_0EXBatteryState) {
  ABI40_0_0EXBatteryStateUnknown = 0,
  ABI40_0_0EXBatteryStateUnplugged,
  ABI40_0_0EXBatteryStateCharging,
  ABI40_0_0EXBatteryStateFull
};


@interface ABI40_0_0EXBattery : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer, ABI40_0_0UMEventEmitter>

@end

NS_ASSUME_NONNULL_END
