// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI41_0_0EXTestSuiteCompletedNotification;

typedef enum ABI41_0_0EXTestEnvironment {
  ABI41_0_0EXTestEnvironmentNone = 0,
  ABI41_0_0EXTestEnvironmentLocal = 1,
  ABI41_0_0EXTestEnvironmentCI = 2,
} ABI41_0_0EXTestEnvironment;

@interface ABI41_0_0EXTest : NSObject <ABI41_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI41_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI41_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
