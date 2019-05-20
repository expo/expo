// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>
#import <UMCore/UMDefines.h>

NS_ASSUME_NONNULL_BEGIN

@interface UMLogManager : UMSingletonModule

- (void)info:(NSString *)message;
- (void)warn:(NSString *)message;
- (void)error:(NSString *)message;
- (void)fatal:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
