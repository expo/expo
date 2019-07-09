// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXGoogleAuthManager.h"

#import <AppAuth.h>

@import GoogleSignIn;

@interface EXGoogleAuthManager ()

// EXGoogleAuthManager can be removed once SDK31 is phased out,
// let's not spend time migrating to new classes
// if we'll remove the class altogether soon.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
@property (nonatomic, nullable, strong) id<OIDAuthorizationFlowSession> currentAuthorizationFlow;
#pragma clang diagnostic pop

@end

@implementation EXGoogleAuthManager

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(nullable NSString *)sourceApplication annotation:(id)annotation
{
  if ([_currentAuthorizationFlow resumeAuthorizationFlowWithURL:url]) {
    _currentAuthorizationFlow = nil;
    return YES;
  }
  
  if ([[GIDSignIn sharedInstance] handleURL:url
                          sourceApplication:sourceApplication
                                 annotation:annotation]) {
    return YES;
  }
  return NO;
}

#pragma mark - scoped module delegate

- (void)googleModule:(__unused id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession
{
  _currentAuthorizationFlow = authorizationFlowSession;
}

@end
