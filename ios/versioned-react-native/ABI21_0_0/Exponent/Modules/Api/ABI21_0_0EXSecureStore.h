// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedBridgeModule.h"

@class ABI21_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI21_0_0EXSecureStoreAccessible) {
  ABI21_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI21_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI21_0_0EXSecureStoreAccessibleAlways = 2,
  ABI21_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI21_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI21_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI21_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI21_0_0EXSecureStore: ABI21_0_0EXScopedBridgeModule

@end
