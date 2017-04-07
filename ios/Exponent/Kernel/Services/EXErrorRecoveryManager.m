// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"

// if the app crashes and it has not yet been 5 seconds since it loaded, don't auto refresh.
#define EX_AUTO_REFRESH_BUFFER_SECONDS 5.0

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
  if (!experienceId) {
    NSAssert(experienceId, @"Cannot associate recovery info with a nil experience id");
  }
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
  if (!experienceId) {
    NSAssert(experienceId, @"Cannot associate an error with a nil experience id");
  }
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (error) {
    if (!record) {
      record = [[EXErrorRecoveryRecord alloc] init];
      _experienceInfo[experienceId] = record;
    }
    // mark this experience id as having loading problems, so future attempts will bust the cache.
    // this flag never gets unset until the record is removed, even if the error is nullified.
    record.isRecovering = YES;
  }
  if (record) {
    record.error = error;
  }
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

- (void)experienceRestartedWithId:(NSString *)experienceId
{
  [_experienceInfo removeObjectForKey:experienceId];
}

- (void)experienceFinishedLoadingWithId:(NSString *)experienceId
{
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (!record) {
    record = [[EXErrorRecoveryRecord alloc] init];
    _experienceInfo[experienceId] = record;
  }
  record.dtmLastLoaded = [NSDate date];
}

- (BOOL)experienceIdIsRecoveringFromError:(NSString *)experienceId
{
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (record) {
    return record.isRecovering;
  }
  return NO;
}

- (BOOL)experienceIdShouldReloadOnError:(NSString *)experienceId
{
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (record) {
    return ([record.dtmLastLoaded timeIntervalSinceNow] < -EX_AUTO_REFRESH_BUFFER_SECONDS);
  }
  // if we have no knowledge of this experience, sure, try reloading right away.
  return YES;
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
