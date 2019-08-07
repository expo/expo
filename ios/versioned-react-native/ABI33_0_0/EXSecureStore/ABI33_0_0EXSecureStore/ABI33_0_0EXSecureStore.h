//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI33_0_0UMCore/ABI33_0_0UMExportedModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI33_0_0EXSecureStoreAccessible) {
  ABI33_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI33_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI33_0_0EXSecureStoreAccessibleAlways = 2,
  ABI33_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI33_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI33_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI33_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI33_0_0EXSecureStore : ABI33_0_0UMExportedModule

@end
