// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRegistry.h"
#import "EXKernelAppLoader.h"
#import "EXKernel.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernelReactAppManager.h"

#import <React/RCTBridge.h>

@interface EXKernelAppRegistry ()

@property (nonatomic, strong) NSMutableDictionary *appRegistry;
@property (nonatomic, assign) EXKernelReactAppManager *kernelAppManager;

@end

@implementation EXKernelAppRegistry

- (instancetype)init
{
  if (self = [super init]) {
    _appRegistry = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (NSString *)registerAppWithManifestUrl:(NSURL *)manifestUrl
{
  NSAssert(manifestUrl, @"Cannot register an app with no manifest URL");
  // not enforcing uniqueness yet - we will do this once we download the manifest & have the experienceId
  EXKernelAppRecord *newRecord = [EXKernelAppRecord recordWithManifestUrl:manifestUrl];
  NSString *recordId = [[NSUUID UUID] UUIDString];
  [_appRegistry setObject:newRecord forKey:recordId];
  return recordId;
}

- (void)unregisterAppWithRecordId:(NSString *)recordId
{
  EXKernelAppRecord *record = [_appRegistry objectForKey:recordId];
  if (record) {
    if (_delegate) {
      [_delegate appRegistry:self willUnregisterAppRecord:record];
    }
    [_appRegistry removeObjectForKey:recordId];
  }
}

- (void)_addAppManager:(EXFrameReactAppManager *)appManager toRecord:(EXKernelAppRecord *)appRecord
{
  appRecord.appManager = appManager;

  // TODO: this assumes we always load apps in the foreground (true at time of writing)
  _lastKnownForegroundAppManager = appManager;

  if (_delegate) {
    [_delegate appRegistry:self didRegisterAppRecord:appRecord];
  }
}

- (void)addAppManager:(EXFrameReactAppManager *)appManager toRecordWithId:(NSString *)recordId
{
  EXKernelAppRecord *appRecord = [self recordForId:recordId];
  [self _addAppManager:appManager toRecord:appRecord];
}

- (void)addAppManager:(EXFrameReactAppManager *)appManager toRecordWithExperienceId:(NSString *)experienceId
{
  EXKernelAppRecord *appRecord = [self newestRecordWithExperienceId:experienceId];
  [self _addAppManager:appManager toRecord:appRecord];
}

- (void)unregisterRecordWithExperienceId:(NSString *)experienceId
{
  for (NSString *recordId in self.appEnumerator) {
    EXKernelAppRecord *record = [self recordForId:recordId];
    if (record && record.experienceId != nil && [record.experienceId isEqualToString:experienceId]) {
      [self unregisterAppWithRecordId:recordId];
      break;
    }
  }
}

- (void)setExperienceFinishedLoading:(BOOL)experienceFinishedLoading onRecordWithId:(NSString *)recordId
{
  EXKernelAppRecord *record = [self recordForId:recordId];
  if (record) {
    record.experienceFinishedLoading = experienceFinishedLoading;
  }
}

- (void)setExperienceFinishedLoading:(BOOL)experienceFinishedLoading onRecordWithExperienceId:(NSString *)experienceId
{
  EXKernelAppRecord *record = [self newestRecordWithExperienceId:experienceId];
  if (record) {
    record.experienceFinishedLoading = experienceFinishedLoading;
  }
}

- (void)registerKernelAppManager:(EXKernelReactAppManager *)appManager
{
  _kernelAppManager = appManager;
}

- (void)unregisterKernelAppManager
{
  _kernelAppManager = nil;
}

- (EXKernelReactAppManager *)kernelAppManager
{
  return _kernelAppManager;
}

- (EXKernelAppRecord *)recordForId:(NSString *)recordId
{
  return [_appRegistry objectForKey:recordId];
}

// when reloading, for a brief period of time there are two records with the same experienceId in the registry
- (EXKernelAppRecord * _Nullable)newestRecordWithExperienceId:(NSString *)experienceId
{
  EXKernelAppRecord *recordToReturn;
  for (NSString *recordId in self.appEnumerator) {
    EXKernelAppRecord *record = [self recordForId:recordId];
    if (record && record.experienceId && [record.experienceId isEqualToString:experienceId]) {
      if (recordToReturn && [recordToReturn.timeCreated compare:record.timeCreated] == NSOrderedDescending) {
        continue;
      }
      recordToReturn = record;
    }
  }
  return recordToReturn;
}

- (NSEnumerator<id> *)appEnumerator
{
  // TODO: use mutexes to control access to _appRegistry rather than just copying it here
  return [(NSDictionary *)[_appRegistry copy] keyEnumerator];
}

- (EXReactAppManager *)lastKnownForegroundAppManager
{
  if (_lastKnownForegroundAppManager) {
    return _lastKnownForegroundAppManager;
  }
  return _kernelAppManager;
}

- (NSString *)description
{
  if (_appRegistry.count > 0) {
    NSMutableString *results = [NSMutableString string];
    for (NSString *recordId in self.appEnumerator) {
      EXKernelAppRecord *record = [self recordForId:recordId];
      [results appendString:[NSString stringWithFormat:@"  %@: %@\n", recordId, record]];
    }
    return [NSString stringWithFormat:@"EXKernelAppRegistry with apps: {\n%@}", results];
  }
  return @"EXKernelAppRegistry (empty)";
}

- (BOOL)isExperienceIdUnique:(NSString *)experienceId
{
  int count = 0;
  for (NSString *recordId in self.appEnumerator) {
    EXKernelAppRecord *appRecord = [self recordForId:recordId];
    if (appRecord.experienceId && [appRecord.experienceId isEqualToString:experienceId]) {
      count++;
      if (count > 1) {
        return NO;
      }
    }
  }
  return YES;
}

@end
