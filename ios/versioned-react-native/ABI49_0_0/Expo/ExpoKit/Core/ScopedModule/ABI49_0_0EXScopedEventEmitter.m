// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI49_0_0EXScopedEventEmitter.h"

@implementation ABI49_0_0EXScopedEventEmitter

+ (NSString *)moduleName
{
  NSAssert(NO, @"ABI49_0_0EXScopedEventEmitter is abstract, you should only export subclasses to the bridge.");
  return @"ExponentScopedEventEmitter";
}

+ (NSString *)getScopeKeyFromEventEmitter:(id)eventEmitter
{
  if (eventEmitter) {
    return ((ABI49_0_0EXScopedEventEmitter *)eventEmitter).scopeKey;
  }
  return nil;
}

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                        scopeKey:(NSString *)scopeKey
                                    easProjectId:(NSString *)easProjectId
                           kernelServiceDelegate:(id)kernelServiceInstance
                                          params:(NSDictionary *)params
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  return self;
}

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                        scopeKey:(NSString *)scopeKey
                                    easProjectId:(NSString *)easProjectId
                          kernelServiceDelegates:(NSDictionary *)kernelServiceInstances
                                          params:(NSDictionary *)params
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

@end
