//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI34_0_0EXSecureStoreAccessible) {
  ABI34_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI34_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI34_0_0EXSecureStoreAccessibleAlways = 2,
  ABI34_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI34_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI34_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI34_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI34_0_0EXSecureStore : ABI34_0_0UMExportedModule

@end
