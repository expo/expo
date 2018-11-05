// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI29_0_0EXTestSuiteCompletedNotification;

typedef enum ABI29_0_0EXTestEnvironment {
  ABI29_0_0EXTestEnvironmentNone = 0,
  ABI29_0_0EXTestEnvironmentLocal = 1,
  ABI29_0_0EXTestEnvironmentCI = 2,
} ABI29_0_0EXTestEnvironment;

@interface ABI29_0_0EXTest : NSObject <ABI29_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI29_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI29_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
