// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol ABI30_0_0EXFileSystemManager

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end
