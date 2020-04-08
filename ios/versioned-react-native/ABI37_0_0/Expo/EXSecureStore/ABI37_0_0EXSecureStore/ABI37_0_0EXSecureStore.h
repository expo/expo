//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI37_0_0EXSecureStoreAccessible) {
  ABI37_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI37_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI37_0_0EXSecureStoreAccessibleAlways = 2,
  ABI37_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI37_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI37_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI37_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI37_0_0EXSecureStore : ABI37_0_0UMExportedModule

@end
