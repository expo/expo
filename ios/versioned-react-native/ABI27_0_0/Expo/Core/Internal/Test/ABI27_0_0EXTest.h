// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI27_0_0/ABI27_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI27_0_0EXTestSuiteCompletedNotification;

typedef enum ABI27_0_0EXTestEnvironment {
  ABI27_0_0EXTestEnvironmentNone = 0,
  ABI27_0_0EXTestEnvironmentLocal = 1,
  ABI27_0_0EXTestEnvironmentCI = 2,
} ABI27_0_0EXTestEnvironment;

@interface ABI27_0_0EXTest : NSObject <ABI27_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI27_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI27_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
