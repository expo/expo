// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI30_0_0EXTestSuiteCompletedNotification;

typedef enum ABI30_0_0EXTestEnvironment {
  ABI30_0_0EXTestEnvironmentNone = 0,
  ABI30_0_0EXTestEnvironmentLocal = 1,
  ABI30_0_0EXTestEnvironmentCI = 2,
} ABI30_0_0EXTestEnvironment;

@interface ABI30_0_0EXTest : NSObject <ABI30_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI30_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI30_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
