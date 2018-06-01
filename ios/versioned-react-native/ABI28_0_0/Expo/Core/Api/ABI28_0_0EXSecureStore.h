// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXScopedBridgeModule.h"

@class ABI28_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI28_0_0EXSecureStoreAccessible) {
  ABI28_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI28_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI28_0_0EXSecureStoreAccessibleAlways = 2,
  ABI28_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI28_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI28_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI28_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI28_0_0EXSecureStore: ABI28_0_0EXScopedBridgeModule

@end
