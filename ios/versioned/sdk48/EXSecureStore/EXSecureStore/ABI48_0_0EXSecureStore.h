//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXExportedModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI48_0_0EXSecureStoreAccessible) {
  ABI48_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI48_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI48_0_0EXSecureStoreAccessibleAlways = 2,
  ABI48_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI48_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI48_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI48_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI48_0_0EXSecureStore : ABI48_0_0EXExportedModule

@end
