// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRegistry.h"
#import "EXAppLoader.h"
#import "EXEnvironment.h"
#import "EXReactAppManager.h"
#import "EXKernel.h"

#import <React/RCTBridge.h>

@interface EXKernelAppRegistry ()

@property (nonatomic, strong) NSMutableDictionary *appRegistry;
@property (nonatomic, strong) EXKernelAppRecord *homeAppRecord;

@end

@implementation EXKernelAppRegistry

- (instancetype)init
{
  if (self = [super init]) {
    _appRegistry = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (NSString *)registerAppWithManifestUrl:(NSURL *)manifestUrl initialProps:(NSDictionary *)initialProps
{
  NSAssert(manifestUrl, @"Cannot register an app with no manifest URL");
  // not enforcing uniqueness yet - we will do this once we download the manifest & have the experienceId
  EXKernelAppRecord *newRecord = [[EXKernelAppRecord alloc] initWithManifestUrl:manifestUrl initialProps:initialProps];
  NSString *recordId = [[NSUUID UUID] UUIDString];
  [_appRegistry setObject:newRecord forKey:recordId];
  
  if (_delegate) {
    [_delegate appRegistry:self didRegisterAppRecord:newRecord];
  }
  
  return recordId;
}

- (void)unregisterAppWithRecordId:(NSString *)recordId
{
  EXKernelAppRecord *record = [_appRegistry objectForKey:recordId];
  if (record) {
    if (_delegate) {
      [_delegate appRegistry:self willUnregisterAppRecord:record];
    }
    [record.appManager invalidate];
    [_appRegistry removeObjectForKey:recordId];
  }
}

- (void)unregisterAppWithRecord:(nullable EXKernelAppRecord *)appRecord
{
  NSArray *recordIds = [_appRegistry allKeysForObject:appRecord];
  if (recordIds.count > 0) {
    [self unregisterAppWithRecordId:recordIds[0]];
  }
}

- (void)registerHomeAppRecord:(EXKernelAppRecord *)homeRecord
{
  _homeAppRecord = homeRecord;
}

- (void)unregisterHomeAppRecord
{
  _homeAppRecord = nil;
}

- (EXKernelAppRecord *)homeAppRecord
{
  return _homeAppRecord;
}

- (EXKernelAppRecord *)standaloneAppRecord
{
  if ([EXEnvironment sharedEnvironment].isDetached) {
    for (NSString *recordId in self.appEnumerator) {
      EXKernelAppRecord *record = [self recordForId:recordId];
      if (record.appLoader.manifestUrl
          && [record.appLoader.manifestUrl.absoluteString isEqualToString:[EXEnvironment sharedEnvironment].standaloneManifestUrl]) {
        return record;
      }
    }
  }
  return nil;
}

- (EXKernelAppRecord *)recordForId:(NSString *)recordId
{
  return [_appRegistry objectForKey:recordId];
}

NSString *const SCOPE_KEY_PREFIX = @"sk_";

// when reloading, for a brief period of time there are two records with the same experienceId in the registry
- (EXKernelAppRecord * _Nullable)newestRecordWithExperienceId:(NSString *)experienceId
{
  if ([experienceId hasPrefix:SCOPE_KEY_PREFIX]) {
    return [self newestRecordWithScopeKey:experienceId];
  } else {
    return [self newestRecordWithLegacyExperienceId:experienceId];
  }
}


// when reloading, for a brief period of time there are two records with the same experienceId in the registry
- (EXKernelAppRecord * _Nullable)newestRecordWithScopeKey:(NSString *)scopeKey
{
  EXKernelAppRecord *recordToReturn;
  for (NSString *recordId in self.appEnumerator) {
    EXKernelAppRecord *record = [self recordForId:recordId];
    if (record && record.scopeKey && [record.scopeKey isEqualToString:scopeKey]) {
      if (recordToReturn && [recordToReturn.timeCreated compare:record.timeCreated] == NSOrderedDescending) {
        continue;
      }
      recordToReturn = record;
    }
  }
  return recordToReturn;
}

- (EXKernelAppRecord * _Nullable)newestRecordWithExpoProjectId:(NSString *)expoProjectId
{
  EXKernelAppRecord *recordToReturn;
  for (NSString *recordId in self.appEnumerator) {
    EXKernelAppRecord *record = [self recordForId:recordId];
    if (record && record.expoProjectId && [record.expoProjectId isEqualToString:expoProjectId]) {
      if (recordToReturn && [recordToReturn.timeCreated compare:record.timeCreated] == NSOrderedDescending) {
        continue;
      }
      recordToReturn = record;
    }
  }
  return recordToReturn;
}

- (EXKernelAppRecord * _Nullable)newestRecordWithLegacyExperienceId:(NSString *)legacyExperienceId
{
  EXKernelAppRecord *recordToReturn;
  for (NSString *recordId in self.appEnumerator) {
    EXKernelAppRecord *record = [self recordForId:recordId];
    if (record && record.legacyExperienceId && [record.legacyExperienceId isEqualToString:legacyExperienceId]) {
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


@end
