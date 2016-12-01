// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI12_0_0RCTBridgeModule.h"

@interface ABI12_0_0EXConstants : NSObject <ABI12_0_0RCTBridgeModule>

- (instancetype)initWithProperties: (NSDictionary *)props;

+ (NSString *)getExponentClientVersion;

@end
