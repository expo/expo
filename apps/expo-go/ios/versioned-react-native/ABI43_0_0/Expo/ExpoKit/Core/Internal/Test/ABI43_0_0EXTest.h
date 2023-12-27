// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI43_0_0EXTestSuiteCompletedNotification;

typedef enum ABI43_0_0EXTestEnvironment {
  ABI43_0_0EXTestEnvironmentNone = 0,
  ABI43_0_0EXTestEnvironmentLocal = 1,
  ABI43_0_0EXTestEnvironmentCI = 2,
} ABI43_0_0EXTestEnvironment;

@interface ABI43_0_0EXTest : NSObject <ABI43_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI43_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI43_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
