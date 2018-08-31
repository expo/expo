// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXErrorRecovery.h"
#import "ABI30_0_0EXUnversioned.h"

#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>

@interface ABI30_0_0EXErrorRecovery ()

@property (nonatomic, weak) id <ABI30_0_0EXErrorRecoveryScopedModuleDelegate> errorRecoveryDelegate;

@end

@implementation ABI30_0_0EXErrorRecovery

@synthesize bridge = _bridge;

ABI30_0_0EX_EXPORT_SCOPED_MODULE(ExponentErrorRecovery, ErrorRecoveryManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _errorRecoveryDelegate = kernelServiceInstance;
  }
  return self;
}

ABI30_0_0RCT_EXPORT_METHOD(setRecoveryProps:(NSDictionary *)props)
{
  [_errorRecoveryDelegate setDeveloperInfo:props forScopedModule:self];
}

@end
