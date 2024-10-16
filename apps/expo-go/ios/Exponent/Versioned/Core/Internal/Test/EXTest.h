// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

FOUNDATION_EXPORT NSNotificationName EXTestSuiteCompletedNotification;

@interface EXTest : NSObject <RCTBridgeModule>

- (instancetype)initWithEnvironment:(int)environment NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

+ (int)testEnvironmentFromString:(NSString *)testEnvironmentString;

@end
