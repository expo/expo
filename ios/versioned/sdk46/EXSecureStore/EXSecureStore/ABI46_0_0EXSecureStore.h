//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXExportedModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI46_0_0EXSecureStoreAccessible) {
  ABI46_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI46_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI46_0_0EXSecureStoreAccessibleAlways = 2,
  ABI46_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI46_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI46_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI46_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI46_0_0EXSecureStore : ABI46_0_0EXExportedModule

@end
