// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXTest.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXEnvironment : NSObject

+ (instancetype)sharedEnvironment;

/**
 *  Whether the app was built with a Debug configuration.
 */
@property (nonatomic, readonly) BOOL isDebugXCodeScheme;

/**
 *  Whether the app is running in a test environment (local Xcode test target, CI, or not at all).
 */
@property (nonatomic, assign) EXTestEnvironment testEnvironment;

@end

NS_ASSUME_NONNULL_END
