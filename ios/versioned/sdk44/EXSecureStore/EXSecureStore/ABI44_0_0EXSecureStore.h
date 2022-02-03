//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXExportedModule.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI44_0_0EXSecureStoreAccessible) {
  ABI44_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI44_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI44_0_0EXSecureStoreAccessibleAlways = 2,
  ABI44_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI44_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI44_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI44_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI44_0_0EXSecureStore : ABI44_0_0EXExportedModule

@end
