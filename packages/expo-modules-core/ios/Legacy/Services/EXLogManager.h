// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ExpoModulesCore/EXSingletonModule.h>
#import <ExpoModulesCore/EXDefines.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXLogManager : EXSingletonModule

- (void)info:(NSString *)message;
- (void)warn:(NSString *)message;
- (void)error:(NSString *)message;
- (void)fatal:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
