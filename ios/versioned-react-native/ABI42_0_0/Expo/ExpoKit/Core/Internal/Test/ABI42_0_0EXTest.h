// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI42_0_0EXTestSuiteCompletedNotification;

typedef enum ABI42_0_0EXTestEnvironment {
  ABI42_0_0EXTestEnvironmentNone = 0,
  ABI42_0_0EXTestEnvironmentLocal = 1,
  ABI42_0_0EXTestEnvironmentCI = 2,
} ABI42_0_0EXTestEnvironment;

@interface ABI42_0_0EXTest : NSObject <ABI42_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI42_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI42_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
