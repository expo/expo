// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI49_0_0EXTestSuiteCompletedNotification;

typedef enum ABI49_0_0EXTestEnvironment {
  ABI49_0_0EXTestEnvironmentNone = 0,
  ABI49_0_0EXTestEnvironmentLocal = 1,
  ABI49_0_0EXTestEnvironmentCI = 2,
} ABI49_0_0EXTestEnvironment;

@interface ABI49_0_0EXTest : NSObject <ABI49_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI49_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI49_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
