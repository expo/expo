// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>

@interface ABI17_0_0EXConstants : NSObject <ABI17_0_0RCTBridgeModule>

- (instancetype)initWithProperties: (NSDictionary *)props;

+ (NSString *)getExpoClientVersion;

@end
