//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitterService.h>

NS_ASSUME_NONNULL_BEGIN

// Keep this enum in sync with JavaScript
typedef NS_ENUM(NSInteger, ABI37_0_0EXBatteryState) {
  ABI37_0_0EXBatteryStateUnknown = 0,
  ABI37_0_0EXBatteryStateUnplugged,
  ABI37_0_0EXBatteryStateCharging,
  ABI37_0_0EXBatteryStateFull
};


@interface ABI37_0_0EXBattery : ABI37_0_0UMExportedModule <ABI37_0_0UMModuleRegistryConsumer, ABI37_0_0UMEventEmitter>

@end

NS_ASSUME_NONNULL_END
