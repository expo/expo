// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXAppAuth/ABI37_0_0EXAppAuthSessionsManager.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMDefines.h>

@interface ABI37_0_0EXAppAuthSessionsManager ()

@property (nonatomic, strong) NSMutableSet<id<OIDExternalUserAgentSession>> *currentAuthorizationFlows;

@end

@implementation ABI37_0_0EXAppAuthSessionsManager

ABI37_0_0UM_REGISTER_SINGLETON_MODULE(AppAuthSessionsManager)

- (instancetype)init
{
  if (self = [super init]) {
    _currentAuthorizationFlows = [NSMutableSet new];
  }
  return self;
}

- (void)registerSession:(id<OIDExternalUserAgentSession>)session
{
  if (session) {
    [_currentAuthorizationFlows addObject:session];
  }
}

- (void)unregisterSession:(id<OIDExternalUserAgentSession>)session
{
  if (session) {
    [_currentAuthorizationFlows removeObject:session];
  }
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options {
  for (id<OIDExternalUserAgentSession> session in _currentAuthorizationFlows) {
    if ([session resumeExternalUserAgentFlowWithURL:url]) {
      [_currentAuthorizationFlows removeObject:session];
      return YES;
    }
  }
  return NO;
}

@end
