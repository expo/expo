// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI40_0_0EXTestSuiteCompletedNotification;

typedef enum ABI40_0_0EXTestEnvironment {
  ABI40_0_0EXTestEnvironmentNone = 0,
  ABI40_0_0EXTestEnvironmentLocal = 1,
  ABI40_0_0EXTestEnvironmentCI = 2,
} ABI40_0_0EXTestEnvironment;

@interface ABI40_0_0EXTest : NSObject <ABI40_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI40_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI40_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
