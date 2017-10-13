// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXScopedBridgeModule.h"

@class ABI22_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI22_0_0EXSecureStoreAccessible) {
  ABI22_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI22_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI22_0_0EXSecureStoreAccessibleAlways = 2,
  ABI22_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI22_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI22_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI22_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI22_0_0EXSecureStore: ABI22_0_0EXScopedBridgeModule

@end
