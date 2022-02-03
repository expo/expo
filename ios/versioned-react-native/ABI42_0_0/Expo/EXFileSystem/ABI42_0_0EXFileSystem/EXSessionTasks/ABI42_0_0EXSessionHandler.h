// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMSingletonModule.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXSessionHandler

- (void)invokeCompletionHandlerForSessionIdentifier:(NSString *)identifier;

@end

@interface ABI42_0_0EXSessionHandler : ABI42_0_0UMSingletonModule <UIApplicationDelegate, ABI42_0_0EXSessionHandler>

@end

NS_ASSUME_NONNULL_END
