// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXScopedBridgeModule.h"

@class ABI29_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI29_0_0EXSecureStoreAccessible) {
  ABI29_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI29_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI29_0_0EXSecureStoreAccessibleAlways = 2,
  ABI29_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI29_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI29_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI29_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI29_0_0EXSecureStore: ABI29_0_0EXScopedBridgeModule

@end
