// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName ABI34_0_0EXTestSuiteCompletedNotification;

typedef enum ABI34_0_0EXTestEnvironment {
  ABI34_0_0EXTestEnvironmentNone = 0,
  ABI34_0_0EXTestEnvironmentLocal = 1,
  ABI34_0_0EXTestEnvironmentCI = 2,
} ABI34_0_0EXTestEnvironment;

@interface ABI34_0_0EXTest : NSObject <ABI34_0_0RCTBridgeModule>

- (instancetype)initWithEnvironment:(ABI34_0_0EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (ABI34_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
