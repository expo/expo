//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitter.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI41_0_0EXBatteryState) {
  ABI41_0_0EXBatteryStateUnknown = 0,
  ABI41_0_0EXBatteryStateUnplugged,
  ABI41_0_0EXBatteryStateCharging,
  ABI41_0_0EXBatteryStateFull
};


@interface ABI41_0_0EXBattery : ABI41_0_0UMExportedModule <ABI41_0_0UMModuleRegistryConsumer, ABI41_0_0UMEventEmitter>

@end

NS_ASSUME_NONNULL_END
