// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXUnscopingDataMigrator.h"

@implementation EXUnscopingDataMigrator

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

@end
