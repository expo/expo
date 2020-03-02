// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI37_0_0EXTestSuiteCompletedNotification;

typedef enum ABI37_0_0EXTestEnvironment {
  ABI37_0_0EXTestEnvironmentNone = 0,
  ABI37_0_0EXTestEnvironmentLocal = 1,
  ABI37_0_0EXTestEnvironmentCI = 2,
} ABI37_0_0EXTestEnvironment;

@interface ABI37_0_0EXTest : NSObject <ABI37_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI37_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI37_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
