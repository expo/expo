// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXScopedBridgeModule.h"

@class ABI26_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI26_0_0EXSecureStoreAccessible) {
  ABI26_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI26_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI26_0_0EXSecureStoreAccessibleAlways = 2,
  ABI26_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI26_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI26_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI26_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI26_0_0EXSecureStore: ABI26_0_0EXScopedBridgeModule

@end
