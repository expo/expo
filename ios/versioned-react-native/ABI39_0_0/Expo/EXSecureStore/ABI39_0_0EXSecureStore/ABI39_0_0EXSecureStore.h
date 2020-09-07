//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, ABI39_0_0EXSecureStoreAccessible) {
  ABI39_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI39_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI39_0_0EXSecureStoreAccessibleAlways = 2,
  ABI39_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI39_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI39_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI39_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI39_0_0EXSecureStore : ABI39_0_0UMExportedModule

@end
