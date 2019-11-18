// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI36_0_0EXTestSuiteCompletedNotification;

typedef enum ABI36_0_0EXTestEnvironment {
  ABI36_0_0EXTestEnvironmentNone = 0,
  ABI36_0_0EXTestEnvironmentLocal = 1,
  ABI36_0_0EXTestEnvironmentCI = 2,
} ABI36_0_0EXTestEnvironment;

@interface ABI36_0_0EXTest : NSObject <ABI36_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI36_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI36_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
