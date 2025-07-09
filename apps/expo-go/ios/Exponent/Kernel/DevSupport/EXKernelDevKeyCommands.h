// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXKernelDevKeyCommands : NSObject

+ (instancetype)sharedInstance;

- (void)registerDevCommands;

@end
