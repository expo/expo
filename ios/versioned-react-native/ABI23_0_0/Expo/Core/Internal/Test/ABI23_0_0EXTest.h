// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI23_0_0EXTestSuiteCompletedNotification;

typedef enum ABI23_0_0EXTestEnvironment {
  ABI23_0_0EXTestEnvironmentNone = 0,
  ABI23_0_0EXTestEnvironmentLocal = 1,
  ABI23_0_0EXTestEnvironmentCI = 2,
} ABI23_0_0EXTestEnvironment;

@interface ABI23_0_0EXTest : NSObject <ABI23_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI23_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI23_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
