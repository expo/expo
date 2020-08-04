//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitter.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI38_0_0EXBatteryState) {
  ABI38_0_0EXBatteryStateUnknown = 0,
  ABI38_0_0EXBatteryStateUnplugged,
  ABI38_0_0EXBatteryStateCharging,
  ABI38_0_0EXBatteryStateFull
};


@interface ABI38_0_0EXBattery : ABI38_0_0UMExportedModule <ABI38_0_0UMModuleRegistryConsumer, ABI38_0_0UMEventEmitter>

@end

NS_ASSUME_NONNULL_END
