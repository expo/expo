// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXServerRegistrationModule.h>)

#import "EXScopedServerRegistrationModule.h"
#import "EXUnversioned.h"

static NSString * const kEXRegistrationInfoKey = EX_UNVERSIONED(@"EXNotificationRegistrationInfoKey");

@interface EXServerRegistrationModule (Protected)

- (NSDictionary *)registrationSearchQueryMerging:(NSDictionary *)dictionaryToMerge;
- (NSDictionary *)keychainSearchQueryFor:(NSString *)key merging:(NSDictionary *)dictionaryToMerge;

@end

@interface EXScopedServerRegistrationModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXScopedServerRegistrationModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (NSDictionary *)registrationSearchQueryMerging:(NSDictionary *)dictionaryToMerge
{
  NSString *scopedKey = [kEXRegistrationInfoKey stringByAppendingFormat:@"-%@", _experienceId];
  return [self keychainSearchQueryFor:scopedKey merging:dictionaryToMerge];
}

@end

#endif
