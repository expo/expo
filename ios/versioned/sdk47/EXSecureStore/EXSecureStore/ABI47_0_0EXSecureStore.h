//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXExportedModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI47_0_0EXSecureStoreAccessible) {
  ABI47_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI47_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI47_0_0EXSecureStoreAccessibleAlways = 2,
  ABI47_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI47_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI47_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI47_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI47_0_0EXSecureStore : ABI47_0_0EXExportedModule

@end
