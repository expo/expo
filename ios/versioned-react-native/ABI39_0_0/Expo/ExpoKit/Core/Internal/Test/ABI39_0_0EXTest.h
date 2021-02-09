// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI39_0_0EXTestSuiteCompletedNotification;

typedef enum ABI39_0_0EXTestEnvironment {
  ABI39_0_0EXTestEnvironmentNone = 0,
  ABI39_0_0EXTestEnvironmentLocal = 1,
  ABI39_0_0EXTestEnvironmentCI = 2,
} ABI39_0_0EXTestEnvironment;

@interface ABI39_0_0EXTest : NSObject <ABI39_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI39_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI39_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
