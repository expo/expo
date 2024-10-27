// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelAppRegistry.h"
#import "EXAbstractLoader.h"
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
  // not enforcing uniqueness yet - we will do this once we download the manifest & have the experience scope key
  EXKernelAppRecord *newRecord = [[EXKernelAppRecord alloc] initWithManifestUrl:manifestUrl initialProps:initialProps];
  NSString *recordId = [[NSUUID UUID] UUIDString];
  [_appRegistry setObject:newRecord forKey:recordId];

  return recordId;
}

- (void)unregisterAppWithRecordId:(NSString *)recordId
{
  EXKernelAppRecord *record = [_appRegistry objectForKey:recordId];
  if (record) {
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

- (EXKernelAppRecord *)recordForId:(NSString *)recordId
{
  return [_appRegistry objectForKey:recordId];
}

// when reloading, for a brief period of time there are two records with the same experience scopeKey in the registry
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

- (BOOL)isScopeKeyUnique:(NSString *)scopeKey
{
  int count = 0;
  for (NSString *recordId in self.appEnumerator) {
    EXKernelAppRecord *appRecord = [self recordForId:recordId];
    if (appRecord.scopeKey && [appRecord.scopeKey isEqualToString:scopeKey]) {
      count++;
      if (count > 1) {
        return NO;
      }
    }
  }
  return YES;
}

@end
