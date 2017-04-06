// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"

NSNotificationName const kEXErrorRecoverySetPropsNotification = @"EXErrorRecoverySetPropsNotification";

@interface EXErrorRecoveryRecord : NSObject

@property (nonatomic, assign) BOOL isRecovering;
@property (nonatomic, strong) NSError *error;
@property (nonatomic, assign) NSDate *dtmLastLoaded;
@property (nonatomic, strong) NSDictionary *developerInfo;

@end

@implementation EXErrorRecoveryRecord

@end

@interface EXErrorRecoveryManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, EXErrorRecoveryRecord *> *experienceInfo;

@end

@implementation EXErrorRecoveryManager

- (instancetype)init
{
  if (self = [super init]) {
    _experienceInfo = [NSMutableDictionary dictionary];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleRecoveryPropsNotification:)
                                                 name:kEXErrorRecoverySetPropsNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forExperienceid:(NSString *)experienceId
{
  NSAssert(experienceId, @"Cannot associate recovery info with a nil experience id");
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (!record) {
    record = [[EXErrorRecoveryRecord alloc] init];
    _experienceInfo[experienceId] = record;
  }
  record.developerInfo = developerInfo;
}

- (NSDictionary *)developerInfoForExperienceId:(NSString *)experienceId
{
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (record) {
    return record.developerInfo;
  }
  return nil;
}

- (void)setError:(NSError *)error forExperienceId:(NSString *)experienceId
{
  NSAssert(experienceId, @"Cannot associate an error with a nil experience id");
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (!record) {
    record = [[EXErrorRecoveryRecord alloc] init];
    _experienceInfo[experienceId] = record;
  }
  // mark this experience id as having loading problems, so future attempts will bust the cache.
  // this flag never gets unset until the record is removed, even if the error is nullified.
  record.isRecovering = YES;
  record.error = error;
}

- (BOOL)errorBelongsToExperience:(NSError *)error
{
  if (!error) {
    return NO;
  }
  for (NSString *experienceId in _experienceInfo.allKeys) {
    EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
    if ([record.error isEqual:error]) {
      return YES;
    }
  }
  return NO;
}

- (void)experienceFinishedLoadingWithId:(NSString *)experienceId
{
  [_experienceInfo removeObjectForKey:experienceId];
}

- (BOOL)experienceIdIsRecoveringFromError:(NSString *)experienceId
{
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (record) {
    return record.isRecovering;
  }
  return NO;
}

#pragma mark - internal

- (EXErrorRecoveryRecord *)_recordForExperienceId: (NSString *)experienceId;
{
  if (experienceId) {
    return _experienceInfo[experienceId];
  }
  return nil;
}

- (void)_handleRecoveryPropsNotification:(NSNotification *)notif
{
  NSDictionary *params = notif.userInfo;
  [self setDeveloperInfo:params[@"props"] forExperienceid:params[@"experienceId"]];
}

@end
