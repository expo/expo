// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXErrorRecovery.h"
#import "ABI26_0_0EXUnversioned.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridgeModule.h>

@interface ABI26_0_0EXErrorRecovery ()

@property (nonatomic, weak) id <ABI26_0_0EXErrorRecoveryScopedModuleDelegate> errorRecoveryDelegate;

@end

@implementation ABI26_0_0EXErrorRecovery

@synthesize bridge = _bridge;

ABI26_0_0EX_EXPORT_SCOPED_MODULE(ExponentErrorRecovery, ErrorRecoveryManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _errorRecoveryDelegate = kernelServiceInstance;
  }
  return self;
}

ABI26_0_0RCT_EXPORT_METHOD(setRecoveryProps:(NSDictionary *)props)
{
  [_errorRecoveryDelegate setDeveloperInfo:props forScopedModule:self];
}

@end
