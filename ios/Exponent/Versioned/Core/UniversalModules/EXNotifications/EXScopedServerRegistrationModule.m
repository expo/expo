// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedServerRegistrationModule.h"
#import "EXUnversioned.h"

static NSString * const kEXLastRegistrationsInfosKey = EX_UNVERSIONED(@"EXLastRegistrationsInfosKey");

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

- (void)getLastRegistrationInfoAsyncWithResolver:(UMPromiseResolveBlock)resolve
                                        rejecter:(UMPromiseRejectBlock)reject
{
  NSDictionary *lastRegistrationsInfos = [[NSUserDefaults standardUserDefaults] dictionaryForKey:kEXLastRegistrationsInfosKey] ?: @{};
  resolve(lastRegistrationsInfos[_experienceId]);
}

- (void)setLastRegistrationInfoAsync:(NSString *)lastRegistrationInfo
                            resolver:(UMPromiseResolveBlock)resolve
                            rejecter:(UMPromiseRejectBlock)reject
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *lastRegistrationsInfos = [defaults dictionaryForKey:kEXLastRegistrationsInfosKey] ?: @{};
  NSMutableDictionary *mutableLastRegistrationInfos = [NSMutableDictionary dictionaryWithDictionary:lastRegistrationsInfos];
  if (lastRegistrationInfo) {
    mutableLastRegistrationInfos[_experienceId] = lastRegistrationInfo;
  } else {
    [mutableLastRegistrationInfos removeObjectForKey:_experienceId];
  }
  [defaults setObject:mutableLastRegistrationInfos forKey:kEXLastRegistrationsInfosKey];
  resolve(nil);
}

@end
