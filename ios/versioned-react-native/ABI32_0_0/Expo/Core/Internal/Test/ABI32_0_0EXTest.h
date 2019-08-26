// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI32_0_0EXTestSuiteCompletedNotification;

typedef enum ABI32_0_0EXTestEnvironment {
  ABI32_0_0EXTestEnvironmentNone = 0,
  ABI32_0_0EXTestEnvironmentLocal = 1,
  ABI32_0_0EXTestEnvironmentCI = 2,
} ABI32_0_0EXTestEnvironment;

@interface ABI32_0_0EXTest : NSObject <ABI32_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI32_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI32_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
