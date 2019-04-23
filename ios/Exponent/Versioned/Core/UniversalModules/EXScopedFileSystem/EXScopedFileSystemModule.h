// Copyright 2015-present 650 Industries. All rights reserved.
#import <UIKit/UIKit.h>
#import <EXFileSystem/EXFileSystem.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedFileSystemModule : EXFileSystem

- (instancetype)initWithExperienceId:(NSString *)experienceId;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)generateDocumentDirectoryPath:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
