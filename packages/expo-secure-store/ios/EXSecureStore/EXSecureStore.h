//  Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

typedef NS_ENUM(NSInteger, EXSecureStoreAccessible) {
  EXSecureStoreAccessibleAfterFirstUnlock = 0,
  EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  EXSecureStoreAccessibleAlways = 2,
  EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  EXSecureStoreAccessibleWhenUnlocked = 5,
  EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface EXSecureStore : EXExportedModule

@end
