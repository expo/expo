// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXScopedBridgeModule.h"

@class ABI27_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI27_0_0EXSecureStoreAccessible) {
  ABI27_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI27_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI27_0_0EXSecureStoreAccessibleAlways = 2,
  ABI27_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI27_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI27_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI27_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI27_0_0EXSecureStore: ABI27_0_0EXScopedBridgeModule

@end
