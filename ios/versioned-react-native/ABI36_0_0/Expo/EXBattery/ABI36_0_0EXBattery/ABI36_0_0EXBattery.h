//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitter.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI36_0_0EXBatteryState) {
  ABI36_0_0EXBatteryStateUnknown = 0,
  ABI36_0_0EXBatteryStateUnplugged,
  ABI36_0_0EXBatteryStateCharging,
  ABI36_0_0EXBatteryStateFull
};


@interface ABI36_0_0EXBattery : ABI36_0_0UMExportedModule <ABI36_0_0UMModuleRegistryConsumer, ABI36_0_0UMEventEmitter>

@end

NS_ASSUME_NONNULL_END
