// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXErrorRecovery/EXErrorRecoveryModule.h>)
#import "EXScopedErrorRecoveryModule.h"

extern NSString * const userDefaultsKey; // from EXErrorRecoveryModule

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

- (BOOL)pushProps:(NSDictionary *)props
{
  NSUserDefaults *preferences = [NSUserDefaults standardUserDefaults];
  NSDictionary *errorRecoveryStore = [preferences objectForKey:userDefaultsKey];
  if (errorRecoveryStore == nil) {
    return [EXScopedErrorRecoveryModule updateUserDefaults:preferences
                                        withErrorRecoveryStore:@{ _experienceId: props }];
  } else {
    NSMutableDictionary *propsToSave = [errorRecoveryStore mutableCopy];
    [propsToSave setObject:props forKey:_experienceId];
    return [EXScopedErrorRecoveryModule updateUserDefaults:preferences
                                        withErrorRecoveryStore:propsToSave];
  }
}

- (NSDictionary *)popProps
{
  NSUserDefaults *preferences = [NSUserDefaults standardUserDefaults];
  NSDictionary *errorRecoveryStore = [preferences objectForKey:userDefaultsKey];
  if (errorRecoveryStore != nil) {
    NSDictionary *props = [errorRecoveryStore objectForKey:_experienceId];
    if (props != nil) {
      NSMutableDictionary *storeWithRemovedProps = [errorRecoveryStore mutableCopy];
      [storeWithRemovedProps removeObjectForKey:_experienceId];
      
      [EXScopedErrorRecoveryModule updateUserDefaults:preferences
                                   withErrorRecoveryStore:storeWithRemovedProps];
    }
    return props;
  }
  return nil;
}

+ (BOOL)updateUserDefaults:(NSUserDefaults *)preferences
    withErrorRecoveryStore:(NSDictionary *)newStore
{
  [preferences setObject:newStore forKey:userDefaultsKey];
  return [preferences synchronize];
}

@end
#endif
