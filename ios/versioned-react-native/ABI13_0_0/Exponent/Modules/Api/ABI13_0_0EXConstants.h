// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI13_0_0/ABI13_0_0RCTBridgeModule.h>

@interface ABI13_0_0EXConstants : NSObject <ABI13_0_0RCTBridgeModule>

- (instancetype)initWithProperties: (NSDictionary *)props;

+ (NSString *)getExponentClientVersion;

@end
