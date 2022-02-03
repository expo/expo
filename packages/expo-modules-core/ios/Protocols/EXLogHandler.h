// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXLogHandler

- (void)info:(nonnull NSString *)message;
- (void)warn:(nonnull NSString *)message;
- (void)error:(nonnull NSString *)message;
- (void)fatal:(nonnull NSError *)error;

@end
