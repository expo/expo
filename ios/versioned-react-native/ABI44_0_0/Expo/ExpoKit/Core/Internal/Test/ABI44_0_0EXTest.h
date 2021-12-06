// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI44_0_0EXTestSuiteCompletedNotification;

typedef enum ABI44_0_0EXTestEnvironment {
  ABI44_0_0EXTestEnvironmentNone = 0,
  ABI44_0_0EXTestEnvironmentLocal = 1,
  ABI44_0_0EXTestEnvironmentCI = 2,
} ABI44_0_0EXTestEnvironment;

@interface ABI44_0_0EXTest : NSObject <ABI44_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI44_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI44_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
