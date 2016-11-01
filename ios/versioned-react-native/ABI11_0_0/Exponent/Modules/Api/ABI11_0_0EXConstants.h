// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0RCTBridgeModule.h"

@interface ABI11_0_0EXConstants : NSObject <ABI11_0_0RCTBridgeModule>

- (instancetype)initWithProperties: (NSDictionary *)props;

+ (NSString *)getExponentClientVersion;

@end
