// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppleAuthentication/EXAppleAuthentication.h>
#import <UMCore/UMDefines.h>

@interface EXAppleAuthentication ()

@property (nonatomic, strong) UMPromiseResolveBlock promiseResolve;
@property (nonatomic, strong) UMPromiseRejectBlock promiseReject;

@end

@implementation EXAppleAuthentication

UM_EXPORT_MODULE(ExpoAppleAuthentication);

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
  if (@available(iOS 13.0, *)) {
    return @{
      @"Scope": @{
          @"FullName": ASAuthorizationScopeFullName,
          @"Email": ASAuthorizationScopeEmail,
      },
      @"Operation": @{
          @"Login": ASAuthorizationOperationLogin,
          @"Refresh": ASAuthorizationOperationRefresh,
          @"Logout": ASAuthorizationOperationLogout,
          @"Implicit": ASAuthorizationOperationImplicit,
      },
      @"CredentialState": @{
          @"Authorized": @(ASAuthorizationAppleIDProviderCredentialAuthorized),
          @"Revoked": @(ASAuthorizationAppleIDProviderCredentialRevoked),
          @"NotFound": @(ASAuthorizationAppleIDProviderCredentialNotFound),
      },
      @"UserDetectionStatus": @{
          @"LikelyReal": @(ASUserDetectionStatusLikelyReal),
          @"Unknown": @(ASUserDetectionStatusUnknown),
          @"Unsupported": @(ASUserDetectionStatusUnsupported),
      },
      @"ButtonType": @{
          @"Default": @(ASAuthorizationAppleIDButtonTypeDefault),
          @"SignIn": @(ASAuthorizationAppleIDButtonTypeSignIn),
          @"Continue": @(ASAuthorizationAppleIDButtonTypeContinue),
      },
      @"ButtonStyle": @{
          @"Black": @(ASAuthorizationAppleIDButtonStyleBlack),
          @"White": @(ASAuthorizationAppleIDButtonStyleWhite),
          @"WhiteOutline": @(ASAuthorizationAppleIDButtonStyleWhiteOutline),
      },
    };
  }
  
  return @{};
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(UMPromiseResolveBlock)resolve
                            rejecter:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    return resolve(@(YES));
  }
  
  resolve(@(NO));
}

UM_EXPORT_METHOD_AS(requestAsync,
                    requestAsync:(NSDictionary *)options
                        resolver:(UMPromiseResolveBlock)resolve
                        rejecter:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    _promiseResolve = resolve;
    _promiseReject = reject;
    
    ASAuthorizationAppleIDProvider* appleIDProvider = [[ASAuthorizationAppleIDProvider alloc] init];
    ASAuthorizationAppleIDRequest* request = [appleIDProvider createRequest];
    request.requestedScopes = options[@"requestedScopes"];
    if (options[@"requestedOperation"]) {
      request.requestedOperation = options[@"requestedOperation"];
    }
    
    ASAuthorizationController* ctrl = [[ASAuthorizationController alloc] initWithAuthorizationRequests:@[request]];
    ctrl.presentationContextProvider = self;
    ctrl.delegate = self;
    [ctrl performRequests];
  } else {
    reject(@"RNCAppleSignIn", @"This feature is not available on your iPhone.", nil);
  }
}

UM_EXPORT_METHOD_AS(getCredentialStateAsync,
                    getCredentialStateAsync:(NSString *)userID
                                   resolver:(UMPromiseResolveBlock)resolve
                                   rejecter:(UMPromiseRejectBlock)reject)
{
  
  if (@available(iOS 13.0, *)) {
    ASAuthorizationAppleIDProvider* appleIDProvider = [[ASAuthorizationAppleIDProvider alloc] init];
    [appleIDProvider getCredentialStateForUserID:userID
                                      completion:^(ASAuthorizationAppleIDProviderCredentialState credentialState,
                                                   NSError * _Nullable error) {
      if (error) {
        return reject(@"RNCAppleSignIn", [error localizedDescription], nil);
      }
      resolve(@(credentialState));
    }];
  } else {
    reject(@"RNCAppleSignIn", @"This feature is not available on your iPhone.", nil);
  }
}

- (ASPresentationAnchor)presentationAnchorForAuthorizationController:(ASAuthorizationController *)controller API_AVAILABLE(ios(13.0))
{
  return [[[UIApplication sharedApplication] delegate] window];
}

- (void)authorizationController:(ASAuthorizationController *)controller
   didCompleteWithAuthorization:(ASAuthorization *)authorization API_AVAILABLE(ios(13.0))
{
  ASAuthorizationAppleIDCredential* credential = authorization.credential;
  NSDictionary* user = @{
                         @"fullName": UMNullIfNil(credential.fullName),
                         @"email": UMNullIfNil(credential.email),
                         @"user": credential.user,
                         @"authorizedScopes": credential.authorizedScopes,
                         @"realUserStatus": @(credential.realUserStatus),
                         @"state": UMNullIfNil(credential.state),
                         @"authorizationCode": UMNullIfNil(credential.authorizationCode),
                         @"identityToken": UMNullIfNil(credential.identityToken)
                         };
  _promiseResolve(user);
  _promiseResolve = nil;
  _promiseReject = nil;
}

- (void)authorizationController:(ASAuthorizationController *)controller
           didCompleteWithError:(NSError *)error API_AVAILABLE(ios(13.0))
{
  _promiseReject(@"RNCAppleSignIn", error.description, error);
  _promiseResolve = nil;
  _promiseReject = nil;
}

@end
