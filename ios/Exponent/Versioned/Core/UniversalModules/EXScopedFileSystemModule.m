// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXScopedFileSystemModule.h"
#import <EXFileSystem/EXFileSystem.h>
#import "EXEnvironment.h"

@implementation EXScopedFileSystemModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  self = [super initWithExperienceId:experienceId];
  return self;
}

- (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId
{
  return [EXScopedFileSystemModule documentDirectoryForExperienceId:experienceId];
}

- (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  return [EXScopedFileSystemModule cachesDirectoryForExperienceId:experienceId];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return [EXFileSystem documentDirectoryForExperienceId:experienceId];
  }
  NSString *subdir = [self escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return [EXFileSystem cachesDirectoryForExperienceId:experienceId];
  }
  NSString *subdir = [self escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

@end
