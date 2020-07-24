// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMSingletonModule.h>
#import <EDUMDefines.h>

NS_ASSUME_NONNULL_BEGIN

@interface EDUMLogManager : EDUMSingletonModule

- (void)info:(NSString *)message;
- (void)warn:(NSString *)message;
- (void)error:(NSString *)message;
- (void)fatal:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
