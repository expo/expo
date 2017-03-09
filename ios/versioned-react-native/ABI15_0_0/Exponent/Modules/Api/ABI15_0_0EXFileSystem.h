// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI15_0_0/ABI15_0_0RCTBridgeModule.h>

@interface ABI15_0_0EXFileSystem : NSObject <ABI15_0_0RCTBridgeModule>

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;

@end
