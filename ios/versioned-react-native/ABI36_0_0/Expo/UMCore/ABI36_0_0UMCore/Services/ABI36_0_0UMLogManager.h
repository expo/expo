// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMSingletonModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMDefines.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI36_0_0UMLogManager : ABI36_0_0UMSingletonModule

- (void)info:(NSString *)message;
- (void)warn:(NSString *)message;
- (void)error:(NSString *)message;
- (void)fatal:(NSError *)error;

@end

NS_ASSUME_NONNULL_END
