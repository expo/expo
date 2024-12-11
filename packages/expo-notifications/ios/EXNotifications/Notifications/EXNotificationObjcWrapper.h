// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXNotificationObjcWrapper : NSObject

/**
 Wrapper that allows Swift code to execute Objective-C code that could throw an NSException, which is not catchable by Swift.
 */
+ (BOOL)tryExecute:(nonnull void(NS_NOESCAPE^)(void))tryBlock error:(__autoreleasing NSError * _Nullable * _Nullable)error;

@end

NS_ASSUME_NONNULL_END
