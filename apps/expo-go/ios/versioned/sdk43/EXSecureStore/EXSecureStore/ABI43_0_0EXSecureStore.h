//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXExportedModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI43_0_0EXSecureStoreAccessible) {
  ABI43_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI43_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI43_0_0EXSecureStoreAccessibleAlways = 2,
  ABI43_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI43_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI43_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI43_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI43_0_0EXSecureStore : ABI43_0_0EXExportedModule

@end
