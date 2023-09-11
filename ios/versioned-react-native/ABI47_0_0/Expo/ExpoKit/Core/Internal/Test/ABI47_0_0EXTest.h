// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI47_0_0EXTestSuiteCompletedNotification;

typedef enum ABI47_0_0EXTestEnvironment {
  ABI47_0_0EXTestEnvironmentNone = 0,
  ABI47_0_0EXTestEnvironmentLocal = 1,
  ABI47_0_0EXTestEnvironmentCI = 2,
} ABI47_0_0EXTestEnvironment;

@interface ABI47_0_0EXTest : NSObject <ABI47_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI47_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI47_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
