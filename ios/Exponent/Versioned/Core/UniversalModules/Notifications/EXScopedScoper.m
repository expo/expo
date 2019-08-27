// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedScoper.h"

@interface EXScopedScoper()

@property (strong)NSString *experienceId;

@end

@implementation EXScopedScoper

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init])
  {
    _experienceId = experienceId;
  }
  return self;
}

- (NSString *)getScopedString:(NSString *)string {
  return [NSString stringWithFormat:@"%@:%@", _experienceId, string];
}


@end
