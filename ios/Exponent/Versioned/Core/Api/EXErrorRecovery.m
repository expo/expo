// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorRecovery.h"
#import "EXUnversioned.h"

#import <React/RCTBridgeModule.h>

@interface EXErrorRecovery ()

@property (nonatomic, weak) id <EXErrorRecoveryScopedModuleDelegate> errorRecoveryDelegate;

@end

@implementation EXErrorRecovery

@synthesize bridge = _bridge;

EX_EXPORT_SCOPED_MODULE(ExponentErrorRecovery, ErrorRecoveryManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _errorRecoveryDelegate = kernelServiceInstance;
  }
  return self;
}

RCT_EXPORT_METHOD(setRecoveryProps:(NSDictionary *)props)
{
  [_errorRecoveryDelegate setDeveloperInfo:props forScopedModule:self];
}

@end
