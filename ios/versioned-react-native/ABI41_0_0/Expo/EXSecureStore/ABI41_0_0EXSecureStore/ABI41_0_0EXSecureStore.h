//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI41_0_0UMCore/ABI41_0_0UMExportedModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI41_0_0EXSecureStoreAccessible) {
  ABI41_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI41_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI41_0_0EXSecureStoreAccessibleAlways = 2,
  ABI41_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI41_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI41_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI41_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI41_0_0EXSecureStore : ABI41_0_0UMExportedModule

@end
