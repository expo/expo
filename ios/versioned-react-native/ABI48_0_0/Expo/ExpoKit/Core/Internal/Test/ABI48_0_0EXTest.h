// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI48_0_0EXTestSuiteCompletedNotification;

typedef enum ABI48_0_0EXTestEnvironment {
  ABI48_0_0EXTestEnvironmentNone = 0,
  ABI48_0_0EXTestEnvironmentLocal = 1,
  ABI48_0_0EXTestEnvironmentCI = 2,
} ABI48_0_0EXTestEnvironment;

@interface ABI48_0_0EXTest : NSObject <ABI48_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI48_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI48_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
