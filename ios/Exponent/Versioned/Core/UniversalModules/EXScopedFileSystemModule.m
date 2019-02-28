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

+ (NSString *)generateDocumentDirectoryPath:(NSString *)experienceId
{
  NSString *subdir = [self escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

+ (BOOL)firstStartAfterUpdate:(NSString *)experienceId
{
  NSString *dir = [EXScopedFileSystemModule generateDocumentDirectoryPath:experienceId];
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if ([fileManager fileExistsAtPath:dir]) {
    return true;
  }
  return false;
}

+ (void)moveOldFiles:(NSString *)experienceId
{
  NSString *sourceDir = [EXScopedFileSystemModule generateDocumentDirectoryPath:experienceId];
  NSString *destinationDir = [EXFileSystem documentDirectoryForExperienceId:experienceId];
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSArray<NSString *> *files = [fileManager contentsOfDirectoryAtPath:sourceDir error:nil];

  for (NSString *file in files) {
    [fileManager moveItemAtPath:[sourceDir stringByAppendingPathComponent:file]
                toPath:[destinationDir stringByAppendingPathComponent:file]
                 error:nil];
  }
  [fileManager removeItemAtPath:sourceDir error:nil];
}

+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    if ([EXScopedFileSystemModule firstStartAfterUpdate:experienceId]) {
      [EXScopedFileSystemModule moveOldFiles:experienceId];
    }
    return [EXFileSystem documentDirectoryForExperienceId:experienceId];
  }
  return [EXScopedFileSystemModule generateDocumentDirectoryPath:experienceId];
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
