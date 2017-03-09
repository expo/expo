// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI15_0_0/ABI15_0_0RCTBridgeModule.h>

@interface ABI15_0_0EXConstants : NSObject <ABI15_0_0RCTBridgeModule>

- (instancetype)initWithProperties: (NSDictionary *)props;

+ (NSString *)getExpoClientVersion;

@end
