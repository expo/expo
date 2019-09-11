// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI35_0_0EXTestSuiteCompletedNotification;

typedef enum ABI35_0_0EXTestEnvironment {
  ABI35_0_0EXTestEnvironmentNone = 0,
  ABI35_0_0EXTestEnvironmentLocal = 1,
  ABI35_0_0EXTestEnvironmentCI = 2,
} ABI35_0_0EXTestEnvironment;

@interface ABI35_0_0EXTest : NSObject <ABI35_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI35_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI35_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
