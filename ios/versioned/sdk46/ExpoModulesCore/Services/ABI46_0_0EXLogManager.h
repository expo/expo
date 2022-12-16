// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXSingletonModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXDefines.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXLogManager : ABI46_0_0EXSingletonModule

- (void)info:(NSString *)message;
- (void)warn:(NSString *)message;
- (void)error:(NSString *)message;
- (void)fatal:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
