// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXAppAuth/ABI44_0_0EXAppAuthSessionsManager.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXDefines.h>

@interface ABI44_0_0EXAppAuthSessionsManager ()

@property (nonatomic, strong) NSMutableSet<id<OIDExternalUserAgentSession>> *currentAuthorizationFlows;

@end

@implementation ABI44_0_0EXAppAuthSessionsManager

ABI44_0_0EX_REGISTER_SINGLETON_MODULE(AppAuthSessionsManager)

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
