// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedServerRegistrationModule.h"
#import "EXUnversioned.h"

static NSString * const kEXRegistrationsInfosKey = EX_UNVERSIONED(@"EXNotificationsRegistrationsInfosKey");

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

- (void)getRegistrationInfoAsyncWithResolver:(UMPromiseResolveBlock)resolve
                                    rejecter:(UMPromiseRejectBlock)reject
{
  NSDictionary *registrationsInfos = [[NSUserDefaults standardUserDefaults] dictionaryForKey:kEXRegistrationsInfosKey] ?: @{};
  resolve(registrationsInfos[_experienceId]);
}

- (void)setRegistrationInfoAsync:(NSString *)registrationInfo
                        resolver:(UMPromiseResolveBlock)resolve
                        rejecter:(UMPromiseRejectBlock)reject
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *registrationsInfos = [defaults dictionaryForKey:kEXRegistrationsInfosKey] ?: @{};
  NSMutableDictionary *mutableRegistrationInfos = [NSMutableDictionary dictionaryWithDictionary:registrationsInfos];
  if (registrationInfo) {
    mutableRegistrationInfos[_experienceId] = registrationInfo;
  } else {
    [mutableRegistrationInfos removeObjectForKey:_experienceId];
  }
  [defaults setObject:mutableRegistrationInfos forKey:kEXRegistrationsInfosKey];
  resolve(nil);
}

@end
