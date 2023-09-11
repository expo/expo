// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTDevSettings.h>

@interface ABI47_0_0EXDevSettings : ABI47_0_0RCTDevSettings

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithScopeKey:(NSString *)scopeKey
                             isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
