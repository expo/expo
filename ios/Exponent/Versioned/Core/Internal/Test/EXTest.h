// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName EXTestSuiteCompletedNotification;

typedef enum EXTestEnvironment {
  EXTestEnvironmentNone = 0,
  EXTestEnvironmentLocal = 1,
  EXTestEnvironmentCI = 2,
} EXTestEnvironment;

@interface EXTest : NSObject <RCTBridgeModule>

- (instancetype)initWithEnvironment:(EXTestEnvironment)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
