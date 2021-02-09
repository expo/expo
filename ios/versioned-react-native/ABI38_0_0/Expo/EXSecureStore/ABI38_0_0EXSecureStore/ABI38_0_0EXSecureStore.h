//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI38_0_0UMCore/ABI38_0_0UMExportedModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI38_0_0EXSecureStoreAccessible) {
  ABI38_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI38_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI38_0_0EXSecureStoreAccessibleAlways = 2,
  ABI38_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI38_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI38_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI38_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI38_0_0EXSecureStore : ABI38_0_0UMExportedModule

@end
