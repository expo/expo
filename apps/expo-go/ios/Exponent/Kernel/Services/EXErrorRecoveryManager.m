// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecoveryManager.h"
#import "EXKernel.h"
#import "EXScopedBridgeModule.h"

#import <React/RCTAssert.h>

#import "Expo_Go-Swift.h"

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

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopeKey:(NSString *)scopeKey
{
  if (!scopeKey) {
    NSAssert(scopeKey, @"Cannot associate recovery info with a nil scope key");
  }
  EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
  if (!record) {
    record = [[EXErrorRecoveryRecord alloc] init];
    @synchronized (_experienceInfo) {
      _experienceInfo[scopeKey] = record;
    }
  }
  record.developerInfo = developerInfo;
}

- (NSDictionary *)developerInfoForScopeKey:(NSString *)scopeKey
{
  EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
  if (record) {
    return record.developerInfo;
  }
  return nil;
}

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule
{
  [self setDeveloperInfo:developerInfo forScopeKey:((EXScopedBridgeModule *)scopedModule).scopeKey];
}

- (void)setError:(NSError *)error forScopeKey:(NSString *)scopeKey
{
  if (!scopeKey) {
    NSString *kernelSuggestion = ([EXBuildConstants sharedInstance].isDevKernel) ? @"Make sure EXBuildConstants is configured to load a valid development Kernel JS bundle." : @"";
    NSAssert(scopeKey, @"Cannot associate an error with a nil experience id. %@", kernelSuggestion);
  }
  EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
  if (error) {
    if (!record) {
      record = [[EXErrorRecoveryRecord alloc] init];
      @synchronized (_experienceInfo) {
        _experienceInfo[scopeKey] = record;
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
  NSArray<NSString *> *scopeKeys;
  @synchronized (_experienceInfo) {
    scopeKeys = _experienceInfo.allKeys;
  }
  for (NSString *scopeKey in scopeKeys) {
    EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
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
  NSArray<NSString *> *scopeKeys;
  @synchronized (_experienceInfo) {
    scopeKeys = _experienceInfo.allKeys;
  }
  for (NSString *scopeKey in scopeKeys) {
    EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
    if ([self isJSError:record.error equalToOtherJSError:error]) {
      return [[EXKernel sharedInstance].appRegistry newestRecordWithScopeKey:scopeKey];
    }
  }
  return nil;
}

- (void)experienceFinishedLoadingWithScopeKey:(NSString *)scopeKey
{
  if (!scopeKey) {
    NSAssert(scopeKey, @"Cannot mark an experience with nil id as loaded");
  }
  EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
  if (!record) {
    record = [[EXErrorRecoveryRecord alloc] init];
    @synchronized (_experienceInfo) {
      _experienceInfo[scopeKey] = record;
    }
  }
  record.dtmLastLoaded = [NSDate date];
  record.isRecovering = NO;

  // maintain a global record of when anything last loaded, used to calculate autoreload backoff.
  _dtmAnyExperienceLoaded = [NSDate date];
}

- (BOOL)scopeKeyIsRecoveringFromError:(NSString *)scopeKey
{
  EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
  if (record) {
    return record.isRecovering;
  }
  return NO;
}

- (BOOL)experienceShouldReloadOnError:(NSString *)scopeKey
{
  EXErrorRecoveryRecord *record = [self _recordForScopeKey:scopeKey];
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

- (EXErrorRecoveryRecord *)_recordForScopeKey:(NSString *)scopeKey;
{
  EXErrorRecoveryRecord *result = nil;
  if (scopeKey) {
    @synchronized (_experienceInfo) {
      result = _experienceInfo[scopeKey];
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
