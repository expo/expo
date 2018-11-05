// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI31_0_0EXScopedBridgeModule.h"

@class ABI31_0_0EXSecureStore;

typedef NS_ENUM(NSInteger, ABI31_0_0EXSecureStoreAccessible) {
  ABI31_0_0EXSecureStoreAccessibleAfterFirstUnlock = 0,
  ABI31_0_0EXSecureStoreAccessibleAfterFirstUnlockThisDeviceOnly = 1,
  ABI31_0_0EXSecureStoreAccessibleAlways = 2,
  ABI31_0_0EXSecureStoreAccessibleWhenPasscodeSetThisDeviceOnly = 3,
  ABI31_0_0EXSecureStoreAccessibleAlwaysThisDeviceOnly = 4,
  ABI31_0_0EXSecureStoreAccessibleWhenUnlocked = 5,
  ABI31_0_0EXSecureStoreAccessibleWhenUnlockedThisDeviceOnly = 6
};

@interface ABI31_0_0EXSecureStore: ABI31_0_0EXScopedBridgeModule

@end
