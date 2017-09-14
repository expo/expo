// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXErrorRecovery.h"
#import "ABI21_0_0EXUnversioned.h"

#import <ReactABI21_0_0/ABI21_0_0RCTBridgeModule.h>

@interface ABI21_0_0EXErrorRecovery ()

@property (nonatomic, weak) id <ABI21_0_0EXErrorRecoveryScopedModuleDelegate> errorRecoveryDelegate;

@end

@implementation ABI21_0_0EXErrorRecovery

@synthesize bridge = _bridge;

ABI21_0_0EX_EXPORT_SCOPED_MODULE(ExponentErrorRecovery, ErrorRecoveryManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _errorRecoveryDelegate = kernelServiceInstance;
  }
  return self;
}

ABI21_0_0RCT_EXPORT_METHOD(setRecoveryProps:(NSDictionary *)props)
{
  [_errorRecoveryDelegate setDeveloperInfo:props forScopedModule:self];
}

@end
