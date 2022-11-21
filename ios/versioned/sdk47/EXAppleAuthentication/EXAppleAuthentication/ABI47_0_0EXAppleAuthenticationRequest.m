// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXAppleAuthentication/ABI47_0_0EXAppleAuthenticationRequest.h>
#import <ABI47_0_0EXAppleAuthentication/ABI47_0_0EXAppleAuthenticationMappings.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXDefines.h>

@interface ABI47_0_0EXAppleAuthenticationRequest ()

@property (nonatomic, strong, nonnull) NSDictionary *options;
@property (nonatomic, strong, nullable) void(^callback)(NSDictionary *, NSError *);
@property (nonatomic, strong, nonnull) ASAuthorizationController *authController;

@end

@implementation ABI47_0_0EXAppleAuthenticationRequest

- (instancetype)initWithOptions:(NSDictionary *)options
                    andCallback:(void(^)(NSDictionary *response, NSError *error))callback
{
  if (self = [super init]) {
    _options = options;
    _callback = callback;
  }
  return self;
}

- (void)performOperation:(ASAuthorizationProviderAuthorizationOperation)operation
{
  ASAuthorizationAppleIDProvider* appleIDProvider = [[ASAuthorizationAppleIDProvider alloc] init];
  ASAuthorizationAppleIDRequest* request = [appleIDProvider createRequest];

  NSArray<NSNumber *> *requestedScopes = _options[@"requestedScopes"];

  request.requestedScopes = [ABI47_0_0EXAppleAuthenticationMappings importScopes:requestedScopes];
  request.requestedOperation = operation;

  if (_options[@"user"]) {
    request.user = _options[@"user"];
  }
  if (_options[@"state"]) {
    request.state = _options[@"state"];
  }
  if (_options[@"nonce"]) {
    request.nonce = _options[@"nonce"];
  }

  _authController = [[ASAuthorizationController alloc] initWithAuthorizationRequests:@[request]];
  _authController.presentationContextProvider = self;
  _authController.delegate = self;

  [_authController performRequests];
}

+ (ABI47_0_0EXAppleAuthenticationRequest *)performOperation:(ASAuthorizationProviderAuthorizationOperation)operation
                                       withOptions:(NSDictionary *)options
                                      withCallback:(void(^)(NSDictionary *, NSError *))callback
{
  ABI47_0_0EXAppleAuthenticationRequest *authRequest = [[ABI47_0_0EXAppleAuthenticationRequest alloc] initWithOptions:options andCallback:callback];
  [authRequest performOperation:operation];
  return authRequest;
}

#pragma mark - ASAuthorizationControllerDelegate

- (void)authorizationController:(ASAuthorizationController *)controller
   didCompleteWithAuthorization:(ASAuthorization *)authorization
{
  ASAuthorizationAppleIDCredential *credential = authorization.credential;

  NSDictionary *fullName;
  if (credential.fullName) {
    fullName = [ABI47_0_0EXAppleAuthenticationMappings exportFullName:credential.fullName];
  }
  NSString *authorizationCode;
  if (credential.authorizationCode) {
    authorizationCode = [ABI47_0_0EXAppleAuthenticationMappings exportData:credential.authorizationCode];
  }
  NSString *identityToken;
  if (credential.identityToken) {
    identityToken = [ABI47_0_0EXAppleAuthenticationMappings exportData:credential.identityToken];
  }

  NSDictionary *response = @{
                         @"fullName": ABI47_0_0EXNullIfNil(fullName),
                         @"email": ABI47_0_0EXNullIfNil(credential.email),
                         @"user": credential.user,
                         @"realUserStatus": [ABI47_0_0EXAppleAuthenticationMappings exportRealUserStatus:credential.realUserStatus],
                         @"state": ABI47_0_0EXNullIfNil(credential.state),
                         @"authorizationCode": ABI47_0_0EXNullIfNil(authorizationCode),
                         @"identityToken": ABI47_0_0EXNullIfNil(identityToken),
                         };

  if (_callback) {
    _callback(response, nil);
    _callback = nil;
  }
}

- (void)authorizationController:(ASAuthorizationController *)controller
           didCompleteWithError:(NSError *)error
{
  if (_callback) {
    _callback(nil, error);
    _callback = nil;
  }
}

#pragma mark - ASAuthorizationControllerPresentationContextProviding

- (nonnull ASPresentationAnchor)presentationAnchorForAuthorizationController:(nonnull ASAuthorizationController *)controller
{
  return [[UIApplication sharedApplication] keyWindow];
}

@end
