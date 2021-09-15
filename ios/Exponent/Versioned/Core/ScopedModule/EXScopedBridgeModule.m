// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"

@implementation EXScopedBridgeModule

+ (NSString *)moduleName
{
  NSAssert(NO, @"EXScopedBridgeModule is abstract, you should only export subclasses to the bridge.");
  return @"ExponentScopedBridgeModule";
}

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                        scopeKey:(NSString *)scopeKey
                                    easProjectId:(NSString *)easProjectId
                           kernelServiceDelegate:(id)kernelServiceInstance
                                          params:(NSDictionary *)params
{
  if (self = [super init]) {
    _experienceStableLegacyId = experienceStableLegacyId;
    _scopeKey = scopeKey;
    _easProjectId = easProjectId;
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
    _experienceStableLegacyId = experienceStableLegacyId;
    _scopeKey = scopeKey;
    _easProjectId = easProjectId;
  }
  return self;
}

@end
