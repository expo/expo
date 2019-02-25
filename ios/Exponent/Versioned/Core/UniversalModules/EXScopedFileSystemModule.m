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
  if (![self isItExpoClient]) {
    return [super documentDirectoryForExperienceId:experienceId];
  }
  return [EXFileSystem documentDirectoryForExperienceId:experienceId];
}

- (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId
{
  if (![self isItExpoClient]) {
    return [super cachesDirectoryForExperienceId:experienceId];
  }
  return [EXFileSystem cachesDirectoryForExperienceId:experienceId];
}

- (bool)isItExpoClient
{
  return [_appOwnership isEqualToString:@"expo"];
}
@end
