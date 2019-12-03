// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI36_0_0EXScopedEventEmitter.h"

@implementation ABI36_0_0EXScopedEventEmitter

+ (NSString *)moduleName
{
  NSAssert(NO, @"ABI36_0_0EXScopedEventEmitter is abstract, you should only export subclasses to the bridge.");
  return @"ExponentScopedEventEmitter";
}

+ (NSString *)getExperienceIdFromEventEmitter:(id)eventEmitter
{
  if (eventEmitter) {
    return ((ABI36_0_0EXScopedEventEmitter *)eventEmitter).experienceId;
  }
  return nil;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegates:(NSDictionary *)kernelServiceInstances params:(NSDictionary *)params
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

@end
