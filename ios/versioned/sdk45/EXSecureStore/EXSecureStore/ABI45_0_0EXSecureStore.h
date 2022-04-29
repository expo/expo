//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI45_0_0EXSecureStoreAccessible) {
  ABI45_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI45_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI45_0_0EXSecureStoreAccessibleAlways = 2,
  ABI45_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI45_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI45_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI45_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI45_0_0EXSecureStore : ABI45_0_0EXExportedModule

@end
