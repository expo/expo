// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI28_0_0EXTestSuiteCompletedNotification;

typedef enum ABI28_0_0EXTestEnvironment {
  ABI28_0_0EXTestEnvironmentNone = 0,
  ABI28_0_0EXTestEnvironmentLocal = 1,
  ABI28_0_0EXTestEnvironmentCI = 2,
} ABI28_0_0EXTestEnvironment;

@interface ABI28_0_0EXTest : NSObject <ABI28_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI28_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI28_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
