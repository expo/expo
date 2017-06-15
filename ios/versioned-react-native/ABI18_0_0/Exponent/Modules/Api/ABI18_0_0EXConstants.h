// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI18_0_0/ABI18_0_0RCTBridgeModule.h>

@interface ABI18_0_0EXConstants : NSObject <ABI18_0_0RCTBridgeModule>

- (instancetype)initWithProperties: (NSDictionary *)props;

+ (NSString *)getExpoClientVersion;

@end
