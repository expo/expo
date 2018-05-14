// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXFileSystem

@property (nonatomic, readonly) NSString *cachesDirectory;

- (NSString *)generatePathInDirectory:(NSString *)directory withExtension:(NSString *)extension;

@end
