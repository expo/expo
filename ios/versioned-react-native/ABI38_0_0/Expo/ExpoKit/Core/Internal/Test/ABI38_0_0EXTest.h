// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI38_0_0EXTestSuiteCompletedNotification;

typedef enum ABI38_0_0EXTestEnvironment {
  ABI38_0_0EXTestEnvironmentNone = 0,
  ABI38_0_0EXTestEnvironmentLocal = 1,
  ABI38_0_0EXTestEnvironmentCI = 2,
} ABI38_0_0EXTestEnvironment;

@interface ABI38_0_0EXTest : NSObject <ABI38_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI38_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI38_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
