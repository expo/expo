// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMSingletonModule.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI39_0_0EXSessionHandler

- (void)invokeCompletionHandlerForSessionIdentifier:(NSString *)identifier;

@end

@interface ABI39_0_0EXSessionHandler : ABI39_0_0UMSingletonModule <UIApplicationDelegate, ABI39_0_0EXSessionHandler>

@end

NS_ASSUME_NONNULL_END
