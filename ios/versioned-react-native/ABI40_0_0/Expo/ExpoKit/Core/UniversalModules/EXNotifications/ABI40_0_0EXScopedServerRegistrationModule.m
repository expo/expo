// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXServerRegistrationModule.h>)

#import "ABI40_0_0EXScopedServerRegistrationModule.h"
#import "ABI40_0_0EXUnversioned.h"

static NSString * const kEXRegistrationInfoKey = @"EXNotificationRegistrationInfoKey";

@interface ABI40_0_0EXServerRegistrationModule (Protected)

- (NSDictionary *)registrationSearchQueryMerging:(NSDictionary *)dictionaryToMerge;
- (NSDictionary *)keychainSearchQueryFor:(NSString *)key merging:(NSDictionary *)dictionaryToMerge;

@end

@interface ABI40_0_0EXScopedServerRegistrationModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI40_0_0EXScopedServerRegistrationModule

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
