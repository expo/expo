//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI35_0_0EXSecureStoreAccessible) {
  ABI35_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI35_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI35_0_0EXSecureStoreAccessibleAlways = 2,
  ABI35_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI35_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI35_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI35_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI35_0_0EXSecureStore : ABI35_0_0UMExportedModule

@end
