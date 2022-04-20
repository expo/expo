// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI45_0_0EXTestSuiteCompletedNotification;

typedef enum ABI45_0_0EXTestEnvironment {
  ABI45_0_0EXTestEnvironmentNone = 0,
  ABI45_0_0EXTestEnvironmentLocal = 1,
  ABI45_0_0EXTestEnvironmentCI = 2,
} ABI45_0_0EXTestEnvironment;

@interface ABI45_0_0EXTest : NSObject <ABI45_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI45_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI45_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
