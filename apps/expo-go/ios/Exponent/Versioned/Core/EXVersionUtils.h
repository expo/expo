// Copyright 2023-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>

@interface EXVersionUtils : NSObject

+ (nonnull void *)versionedJsExecutorFactoryForBridge:(nonnull RCTBridge *)bridge
                                               engine:(nonnull NSString *)jsEngine;

@end
