//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI42_0_0UMCore/ABI42_0_0UMExportedModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI42_0_0EXSecureStoreAccessible) {
  ABI42_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI42_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI42_0_0EXSecureStoreAccessibleAlways = 2,
  ABI42_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI42_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI42_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI42_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI42_0_0EXSecureStore : ABI42_0_0UMExportedModule

@end
