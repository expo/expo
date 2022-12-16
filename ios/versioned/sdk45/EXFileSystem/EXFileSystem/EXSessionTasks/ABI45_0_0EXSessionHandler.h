// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXSingletonModule.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI45_0_0EXSessionHandler

- (void)invokeCompletionHandlerForSessionIdentifier:(NSString *)identifier;

@end

@interface ABI45_0_0EXSessionHandler : ABI45_0_0EXSingletonModule <UIApplicationDelegate, ABI45_0_0EXSessionHandler>

@end

NS_ASSUME_NONNULL_END
