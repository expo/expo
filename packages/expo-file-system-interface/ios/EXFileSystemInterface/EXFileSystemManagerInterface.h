// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@protocol EXFileSystemManager

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end
