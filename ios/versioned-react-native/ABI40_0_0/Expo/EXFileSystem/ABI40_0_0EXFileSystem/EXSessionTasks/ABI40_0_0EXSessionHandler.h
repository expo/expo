// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMSingletonModule.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI40_0_0EXSessionHandler

- (void)invokeCompletionHandlerForSessionIdentifier:(NSString *)identifier;

@end

@interface ABI40_0_0EXSessionHandler : ABI40_0_0UMSingletonModule <UIApplicationDelegate, ABI40_0_0EXSessionHandler>

@end

NS_ASSUME_NONNULL_END
