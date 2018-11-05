// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConstants.h"
#import "EXErrorRecoveryManager.h"
#import "EXKernel.h"

#import <React/RCTAssert.h>

// if the app crashes and it has not yet been 5 seconds since it loaded, don't auto refresh.
#define EX_AUTO_REFRESH_BUFFER_BASE_SECONDS 5.0

@interface EXErrorRecoveryRecord : NSObject

@property (nonatomic, assign) BOOL isRecovering;
@property (nonatomic, strong) NSError *error;
@property (nonatomic, strong) NSDate *dtmLastLoaded;
@property (nonatomic, strong) NSDictionary *developerInfo;

@end

@implementation EXErrorRecoveryRecord

@end

@interface EXErrorRecoveryManager ()

@property (nonatomic, strong) NSMutableDictionary<NSString *, EXErrorRecoveryRecord *> *experienceInfo;
@property (nonatomic, assign) NSUInteger reloadBufferDepth;
@property (nonatomic, strong) NSDate *dtmAnyExperienceLoaded;

@end

@implementation EXErrorRecoveryManager

- (instancetype)init
{
  if (self = [super init]) {
    _reloadBufferDepth = 0;
    _dtmAnyExperienceLoaded = [NSDate date];
    _experienceInfo = [NSMutableDictionary dictionary];
  }
  return self;
}

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forExperienceid:(NSString *)experienceId
{
  if (!experienceId) {
    NSAssert(experienceId, @"Cannot associate recovery info with a nil experience id");
  }
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (!record) {
    record = [[EXErrorRecoveryRecord alloc] init];
    @synchronized (_experienceInfo) {
      _experienceInfo[experienceId] = record;
    }
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

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule
{
  [self setDeveloperInfo:developerInfo forExperienceid:((EXScopedBridgeModule *)scopedModule).experienceId];
}

- (void)setError:(NSError *)error forExperienceId:(NSString *)experienceId
{
  if (!experienceId) {
    NSString *kernelSuggestion = ([EXBuildConstants sharedInstance].isDevKernel) ? @"Make sure EXBuildConstants is configured to load a valid development Kernel JS bundle." : @"";
    NSAssert(experienceId, @"Cannot associate an error with a nil experience id. %@", kernelSuggestion);
  }
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (error) {
    if (!record) {
      record = [[EXErrorRecoveryRecord alloc] init];
      @synchronized (_experienceInfo) {
        _experienceInfo[experienceId] = record;
      }
    }
    // mark this experience id as having loading problems, so future attempts will bust the cache.
    // this flag never gets unset until the app loads successfully, even if the error is nullified.
    record.isRecovering = YES;
  }
  if (record) {
    // if this record already shows an error,
    // and the new error is about AppRegistry,
    // don't override the previous error message.
    if (record.error &&
        [error.localizedDescription rangeOfString:@"AppRegistry is not a registered callable module"].length != 0) {
      DDLogWarn(@"Ignoring misleading error: %@", error);
    } else {
      record.error = error;
    }
  }
}

- (BOOL)errorBelongsToExperience:(NSError *)error
{
  if (!error) {
    return NO;
  }
  NSArray<NSString *> *experienceIds;
  @synchronized (_experienceInfo) {
    experienceIds = _experienceInfo.allKeys;
  }
  for (NSString *experienceId in experienceIds) {
    EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
    if ([self isJSError:record.error equalToOtherJSError:error]) {
      return YES;
    }
  }
  return NO;
}

- (EXKernelAppRecord *)appRecordForError:(NSError *)error
{
  if (!error) {
    return nil;
  }
  NSArray<NSString *> *experienceIds;
  @synchronized (_experienceInfo) {
    experienceIds = _experienceInfo.allKeys;
  }
  for (NSString *experienceId in experienceIds) {
    EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
    if ([self isJSError:record.error equalToOtherJSError:error]) {
      return [[EXKernel sharedInstance].appRegistry newestRecordWithExperienceId:experienceId];
    }
  }
  return nil;
}

- (void)experienceFinishedLoadingWithId:(NSString *)experienceId
{
  EXErrorRecoveryRecord *record = [self _recordForExperienceId:experienceId];
  if (!record) {
    record = [[EXErrorRecoveryRecord alloc] init];
    @synchronized (_experienceInfo) {
      _experienceInfo[experienceId] = record;
    }
  }
  record.dtmLastLoaded = [NSDate date];
  record.isRecovering = NO;

  // maintain a global record of when anything last loaded, used to calculate autoreload backoff.
  _dtmAnyExperienceLoaded = [NSDate date];
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
    return ([record.dtmLastLoaded timeIntervalSinceNow] < -[self reloadBufferSeconds]);
  }
  // if we have no knowledge of this experience, this is probably a manifest loading error
  // so we should assume we'd just hit the same issue again next time. don't try to autoreload.
  return NO;
}

- (void)increaseAutoReloadBuffer
{
  _reloadBufferDepth++;
}

#pragma mark - internal

- (BOOL)isJSError:(NSError *)error1 equalToOtherJSError: (NSError *)error2
{
  // use rangeOfString: to catch versioned RCTErrorDomain
  if ([error1.domain rangeOfString:RCTErrorDomain].length > 0 && [error2.domain rangeOfString:RCTErrorDomain].length > 0) {
    NSDictionary *userInfo1 = error1.userInfo;
    NSDictionary *userInfo2 = error2.userInfo;
    // could also possibly compare ([userInfo1[RCTJSStackTraceKey] isEqual:userInfo2[RCTJSStackTraceKey]]) if this isn't enough
    return ([userInfo1[NSLocalizedDescriptionKey] isEqualToString:userInfo2[NSLocalizedDescriptionKey]]);
  }
  return [error1 isEqual:error2];
}

- (EXErrorRecoveryRecord *)_recordForExperienceId: (NSString *)experienceId;
{
  EXErrorRecoveryRecord *result = nil;
  if (experienceId) {
    @synchronized (_experienceInfo) {
      result = _experienceInfo[experienceId];
    }
  }
  return result;
}

- (NSTimeInterval)reloadBufferSeconds
{
  NSTimeInterval interval = MIN(60.0 * 5.0, EX_AUTO_REFRESH_BUFFER_BASE_SECONDS * pow(1.5, _reloadBufferDepth));

  // if nothing has loaded for twice our current backoff interval, reset backoff
  if ([_dtmAnyExperienceLoaded timeIntervalSinceNow] < -(interval * 2.0)) {
    _reloadBufferDepth = 0;
    interval = EX_AUTO_REFRESH_BUFFER_BASE_SECONDS;
  }
  return interval;
}

@end
