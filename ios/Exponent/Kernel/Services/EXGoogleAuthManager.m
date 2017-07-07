// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXGoogleAuthManager.h"

#import <GoogleSignIn/GoogleSignIn.h>
#import <AppAuth.h>

NSNotificationName kEXDidBeginOAuthFlowNotification = @"EXDidBeginOAuthFlow";

@interface EXGoogleAuthManager ()

@property (nonatomic, nullable, strong) id<OIDAuthorizationFlowSession> currentAuthorizationFlow;

@end

@implementation EXGoogleAuthManager

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_onBeginOAuthFlow:)
                                                 name:kEXDidBeginOAuthFlowNotification
                                               object:nil];
  }
  return self;
}

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

#pragma mark - internal

- (void)_onBeginOAuthFlow:(NSNotification *)notif
{
  _currentAuthorizationFlow = notif.userInfo[@"authorizationFlow"];
}

@end
