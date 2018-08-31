// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXScopedBridgeModule.h"

@class ABI30_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI30_0_0EXSecureStoreAccessible) {
  ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI30_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI30_0_0EXSecureStoreAccessibleAlways = 2,
  ABI30_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI30_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI30_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI30_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI30_0_0EXSecureStore: ABI30_0_0EXScopedBridgeModule

@end
