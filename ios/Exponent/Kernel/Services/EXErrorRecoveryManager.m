// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"

@interface EXErrorRecoveryManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, NSError *> *experienceInfo;
@property (nonatomic, strong) NSMutableSet *experienceIdErrorRecoverySet;

@end

@implementation EXErrorRecoveryManager

- (instancetype)init
{
  if (self = [super init]) {
    _experienceInfo = [NSMutableDictionary dictionary];
    _experienceIdErrorRecoverySet = [NSMutableSet set];
  }
  return self;
}

- (void)setError:(NSError *)error forExperienceId:(NSString *)experienceId
{
  if (error) {
    // mark this experience id as having loading problems, so future attempts will bust the cache
    _experienceInfo[experienceId] = error;
    [_experienceIdErrorRecoverySet addObject:experienceId];
  } else {
    [_experienceInfo removeObjectForKey:experienceId];
  }
}

- (BOOL)errorBelongsToExperience:(NSError *)error
{
  for (NSString *experienceId in _experienceInfo.allKeys) {
    NSError *experienceError = _experienceInfo[experienceId];
    if ([experienceError isEqual:error]) {
      return YES;
    }
  }
  return NO;
}

- (void)experienceFinishedLoadingWithId:(NSString *)experienceId
{
  [_experienceIdErrorRecoverySet removeObject:experienceId];
}

- (BOOL)experienceIdIsRecoveringFromError:(NSString *)experienceId
{
  return (experienceId && [_experienceIdErrorRecoverySet containsObject:experienceId]);
}

@end
