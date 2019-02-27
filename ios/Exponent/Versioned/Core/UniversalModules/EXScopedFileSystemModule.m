// Copyright 2015-present 650 Industries. All rights reserved.
#import "EXScopedFileSystemModule.h"
#import <EXFileSystem/EXFileSystem.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

@interface EXScopedFileSystemModule ()

@property (nonatomic, weak) NSString *appOwnership;

@end

@implementation EXScopedFileSystemModule

- (instancetype)initWithExperienceId:(NSString *)experienceId constantsModule:(id<EXConstantsInterface>)constantsModule
{
  self.appOwnership = constantsModule.appOwnership;
  self = [super initWithExperienceId:experienceId];
  return self;
}

- (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId
{
  return [EXScopedFileSystemModule documentDirectoryForExperienceId:experienceId isDetached:![self isItExpoClient]];
}

- (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  return [EXScopedFileSystemModule cachesDirectoryForExperienceId:experienceId isDetached:![self isItExpoClient]];
}

- (bool)isItExpoClient
{
  return [_appOwnership isEqualToString:@"expo"];
}

+ (NSString *)escapedResourceName:(NSString *)name
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [name stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId isDetached:(BOOL)isDetached {
  if (isDetached) {
    return [EXFileSystem documentDirectoryForExperienceId:experienceId];
  }
  NSString *subdir = [self escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId isDetached:(BOOL)isDetached {
  if (isDetached) {
    return [EXFileSystem cachesDirectoryForExperienceId:experienceId];
  }
  NSString *subdir = [self escapedResourceName:experienceId];
  return [[[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
            stringByAppendingPathComponent:@"ExponentExperienceData"]
           stringByAppendingPathComponent:subdir] stringByStandardizingPath];
}

@end
