// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"

@class ABI23_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI23_0_0EXSecureStoreAccessible) {
  ABI23_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI23_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI23_0_0EXSecureStoreAccessibleAlways = 2,
  ABI23_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI23_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI23_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI23_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI23_0_0EXSecureStore: ABI23_0_0EXScopedBridgeModule

@end
