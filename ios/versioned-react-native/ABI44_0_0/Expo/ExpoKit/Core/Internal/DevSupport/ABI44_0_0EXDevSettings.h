// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTDevSettings.h>

@interface ABI44_0_0EXDevSettings : ABI44_0_0RCTDevSettings

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithScopeKey:(NSString *)scopeKey
                             isDevelopment:(BOOL)isDevelopment NS_DESIGNATED_INITIALIZER;

@end
