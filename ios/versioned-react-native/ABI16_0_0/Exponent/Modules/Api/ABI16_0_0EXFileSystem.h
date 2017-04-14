// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI16_0_0/ABI16_0_0RCTBridgeModule.h>

@interface ABI16_0_0EXFileSystem : NSObject <ABI16_0_0RCTBridgeModule>

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;

@end
