// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXFileSystemUtilities : NSObject

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end
