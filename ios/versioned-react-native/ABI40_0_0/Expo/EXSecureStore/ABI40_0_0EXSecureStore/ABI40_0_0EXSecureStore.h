//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI40_0_0EXSecureStoreAccessible) {
  ABI40_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI40_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI40_0_0EXSecureStoreAccessibleAlways = 2,
  ABI40_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI40_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI40_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI40_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI40_0_0EXSecureStore : ABI40_0_0UMExportedModule

@end
