// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI31_0_0EXTestSuiteCompletedNotification;

typedef enum ABI31_0_0EXTestEnvironment {
  ABI31_0_0EXTestEnvironmentNone = 0,
  ABI31_0_0EXTestEnvironmentLocal = 1,
  ABI31_0_0EXTestEnvironmentCI = 2,
} ABI31_0_0EXTestEnvironment;

@interface ABI31_0_0EXTest : NSObject <ABI31_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI31_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI31_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
