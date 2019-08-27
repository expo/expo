// Copyright 2019-present 650 Industries. All rights reserved.

#import "EXScopedAppIdProvider.h"

@interface EXScopedAppIdProvider()

@property (atomic, strong)NSString *experienceId;

@end

@implementation EXScopedAppIdProvider

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init])
  {
    _experienceId = experienceId;
  }
  return self;
}

- (NSString *)getAppId {
  return _experienceId;
}

@end
