// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"

@class ABI25_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI25_0_0EXSecureStoreAccessible) {
  ABI25_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI25_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI25_0_0EXSecureStoreAccessibleAlways = 2,
  ABI25_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI25_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI25_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI25_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI25_0_0EXSecureStore: ABI25_0_0EXScopedBridgeModule

@end
