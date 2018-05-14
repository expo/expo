// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXPlatformAdapter

- (void)sendEventWithName:(NSString *)name body:(id)body;

@end

