// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI33_0_0EXTestSuiteCompletedNotification;

typedef enum ABI33_0_0EXTestEnvironment {
  ABI33_0_0EXTestEnvironmentNone = 0,
  ABI33_0_0EXTestEnvironmentLocal = 1,
  ABI33_0_0EXTestEnvironmentCI = 2,
} ABI33_0_0EXTestEnvironment;

@interface ABI33_0_0EXTest : NSObject <ABI33_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI33_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI33_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
