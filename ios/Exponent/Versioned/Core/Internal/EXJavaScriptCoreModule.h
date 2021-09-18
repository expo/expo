// Copyright 2021-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

@interface EXJavaScriptCoreModule : NSObject <RCTBridgeModule>

- (void)setContextName:(NSString *)name;

@end
