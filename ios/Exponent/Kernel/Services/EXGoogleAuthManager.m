// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXGoogleAuthManager.h"

#import <GoogleSignIn/GoogleSignIn.h>
#import <AppAuth.h>

@interface EXGoogleAuthManager ()

@property (nonatomic, nullable, strong) id<OIDAuthorizationFlowSession> currentAuthorizationFlow;

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
