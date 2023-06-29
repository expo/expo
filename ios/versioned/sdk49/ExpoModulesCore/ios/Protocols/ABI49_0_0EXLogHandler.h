// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol ABI49_0_0EXLogHandler

- (void)info:(nonnull NSString *)message;
- (void)warn:(nonnull NSString *)message;
- (void)error:(nonnull NSString *)message;
- (void)fatal:(nonnull NSError *)error;

@end
