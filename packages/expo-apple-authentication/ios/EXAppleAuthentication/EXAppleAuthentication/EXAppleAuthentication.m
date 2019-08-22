
#import "ExpoAppleAuthentication.h"
#import <React/RCTUtils.h>

@interface RNCAppleAuthentication()

// TODO use promise wrapper like in google sign in
@property (nonatomic, strong) RCTPromiseResolveBlock promiseResolve;
@property (nonatomic, strong) RCTPromiseRejectBlock promiseReject;

@end

@implementation RNCAppleAuthentication

RCT_EXPORT_MODULE()

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

RCT_EXPORT_METHOD(isAvailableAsync:(RCTPromiseResolveBlock)resolve
                          rejecter:(RCTPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    return resolve(@(YES));
  }
  
  resolve(@(NO));
}

RCT_EXPORT_METHOD(requestAsync:(NSDictionary *)options
                      resolver:(RCTPromiseResolveBlock)resolve
                      rejecter:(RCTPromiseRejectBlock)reject)
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

RCT_EXPORT_METHOD(getCredentialStateAsync:(NSString *)userID
                                 resolver:(RCTPromiseResolveBlock)resolve
                                 rejecter:(RCTPromiseRejectBlock)reject)
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
  return RCTKeyWindow();
}

- (void)authorizationController:(ASAuthorizationController *)controller
   didCompleteWithAuthorization:(ASAuthorization *)authorization API_AVAILABLE(ios(13.0))
{
  ASAuthorizationAppleIDCredential* credential = authorization.credential;
  NSDictionary* user = @{
                         @"fullName": RCTNullIfNil(credential.fullName),
                         @"email": RCTNullIfNil(credential.email),
                         @"user": credential.user,
                         @"authorizedScopes": credential.authorizedScopes,
                         @"realUserStatus": @(credential.realUserStatus),
                         @"state": RCTNullIfNil(credential.state),
                         @"authorizationCode": RCTNullIfNil(credential.authorizationCode),
                         @"identityToken": RCTNullIfNil(credential.identityToken)
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
