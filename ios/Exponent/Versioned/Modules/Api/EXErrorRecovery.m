// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecovery.h"
#import "EXUnversioned.h"

#import <React/RCTBridgeModule.h>

@interface EXErrorRecoveryNoWarnings

- (void)setDeveloperInfo: (NSDictionary *)developerInfo forExperienceid: (NSString *)experienceId;

@end

@interface EXErrorRecovery ()

// unversioned ErrorRecoveryManager instance
@property (nonatomic, weak) id errorRecoveryManager;

@end

@implementation EXErrorRecovery

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExponentErrorRecovery);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelService:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelService:kernelServiceInstance params:params]) {
    _errorRecoveryManager = kernelServiceInstance;
  }
  return self;
}

RCT_EXPORT_METHOD(setRecoveryProps:(NSDictionary *)props)
{
  [_errorRecoveryManager setDeveloperInfo:props forExperienceid:self.experienceId];
}

@end
