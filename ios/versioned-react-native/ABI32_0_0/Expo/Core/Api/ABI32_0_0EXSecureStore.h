// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXScopedBridgeModule.h"

@class ABI32_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI32_0_0EXSecureStoreAccessible) {
  ABI32_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI32_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI32_0_0EXSecureStoreAccessibleAlways = 2,
  ABI32_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI32_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI32_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI32_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI32_0_0EXSecureStore: ABI32_0_0EXScopedBridgeModule

@end
