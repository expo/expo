// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI21_0_0/ABI21_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI21_0_0EXTestSuiteCompletedNotification;

typedef enum ABI21_0_0EXTestEnvironment {
  ABI21_0_0EXTestEnvironmentNone = 0,
  ABI21_0_0EXTestEnvironmentLocal = 1,
  ABI21_0_0EXTestEnvironmentCI = 2,
} ABI21_0_0EXTestEnvironment;

@interface ABI21_0_0EXTest : NSObject <ABI21_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI21_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI21_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
