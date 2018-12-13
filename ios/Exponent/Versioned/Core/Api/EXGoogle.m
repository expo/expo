// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXGoogle.h"
#import "EXScopedModuleRegistry.h"
#import <React/RCTUtils.h>

@interface EXGoogle ()

@property (nonatomic, weak) id kernelGoogleAuthServiceDelegate;

@end

@implementation EXGoogle
{
}

EX_EXPORT_SCOPED_MODULE(ExponentGoogle, GoogleAuthManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelGoogleAuthServiceDelegate = kernelServiceInstance;
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession
{
  
}

@end
