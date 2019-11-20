// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXErrorRecovery/EXErrorRecoveryModule.h>)
#import "EXScopedErrorRecoveryModule.h"

@interface EXScopedErrorRecoveryModule ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXScopedErrorRecoveryModule

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (BOOL)setRecoveryProps:(NSString *)props
{
  NSUserDefaults *preferences = [NSUserDefaults standardUserDefaults];
  NSDictionary *errorRecoveryStore = [preferences dictionaryForKey:[self userDefaultsKey]] ?: @{};
  NSMutableDictionary *newStore = [errorRecoveryStore mutableCopy];
  newStore[_experienceId] = props;
  [preferences setObject:newStore forKey:[self userDefaultsKey]];
  return [preferences synchronize];
}

- (NSString *)consumeRecoveryProps
{
  NSUserDefaults *preferences = [NSUserDefaults standardUserDefaults];
  NSDictionary *errorRecoveryStore = [preferences dictionaryForKey:[self userDefaultsKey]];
  if (errorRecoveryStore) {
    NSString *props = errorRecoveryStore[_experienceId];
    if (props) {
      NSMutableDictionary *storeWithRemovedProps = [errorRecoveryStore mutableCopy];
      [storeWithRemovedProps removeObjectForKey:_experienceId];
      [preferences setObject:storeWithRemovedProps forKey:[self userDefaultsKey]];
      [preferences synchronize];
      return props;
    }
  }
  return nil;
}

@end
#endif
