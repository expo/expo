// Copyright 2016-present 650 Industries. All rights reserved.

#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>

@interface ABI17_0_0EXFileSystem : NSObject <ABI17_0_0RCTBridgeModule>

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;

@end
