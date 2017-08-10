// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXScopedBridgeModule.h"

@class ABI20_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI20_0_0EXSecureStoreAccessible) {
  ABI20_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI20_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI20_0_0EXSecureStoreAccessibleAlways = 2,
  ABI20_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI20_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI20_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI20_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI20_0_0EXSecureStore: ABI20_0_0EXScopedBridgeModule

@end
