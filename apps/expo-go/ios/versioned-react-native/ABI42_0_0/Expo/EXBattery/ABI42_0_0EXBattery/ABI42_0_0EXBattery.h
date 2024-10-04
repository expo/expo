//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitter.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI42_0_0EXBatteryState) {
  ABI42_0_0EXBatteryStateUnknown = 0,
  ABI42_0_0EXBatteryStateUnplugged,
  ABI42_0_0EXBatteryStateCharging,
  ABI42_0_0EXBatteryStateFull
};


@interface ABI42_0_0EXBattery : ABI42_0_0UMExportedModule <ABI42_0_0UMModuleRegistryConsumer, ABI42_0_0UMEventEmitter>

@end

NS_ASSUME_NONNULL_END
