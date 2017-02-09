// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI14_0_0/ABI14_0_0RCTBridgeModule.h>

@interface ABI14_0_0EXConstants : NSObject <ABI14_0_0RCTBridgeModule>

- (instancetype)initWithProperties: (NSDictionary *)props;

+ (NSString *)getExponentClientVersion;

@end
