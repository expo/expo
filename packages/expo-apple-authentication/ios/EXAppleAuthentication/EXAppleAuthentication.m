// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppleAuthentication/EXAppleAuthentication.h>
#import <EXAppleAuthentication/EXAppleAuthenticationMappings.h>

#import <UMCore/UMDefines.h>
#import <UMCore/UMUtilities.h>

@interface EXAppleAuthentication ()

@property (nonatomic, strong) UMPromiseResolveBlock promiseResolve;
@property (nonatomic, strong) UMPromiseRejectBlock promiseReject;

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id <UMEventEmitterService> eventEmitter;
@property (nonatomic, assign) BOOL hasListeners;

@end

@implementation EXAppleAuthentication

UM_EXPORT_MODULE(ExpoAppleAuthentication);

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  if (_moduleRegistry) {
    [self invalidate];
  }
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"Expo.appleIdCredentialRevoked"];
}

- (void)invalidate
{
  _eventEmitter = nil;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)startObserving
{
  if (@available(iOS 13.0, *)) {
    _hasListeners = YES;
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(credentialRevoked:)
                                                 name:ASAuthorizationAppleIDProviderCredentialRevokedNotification
                                               object:nil];
  }
}

- (void)stopObserving
{
  if (@available(iOS 13.0, *)) {
    _hasListeners = NO;
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:ASAuthorizationAppleIDProviderCredentialRevokedNotification
                                                  object:nil];
  }
}

- (void)credentialRevoked:(NSNotification *)notification
{
  if (!_hasListeners) {
    return;
  }
  [_eventEmitter sendEventWithName:@"Expo.appleIdCredentialRevoked" body:@{@"type": @"revoke"}];
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

    NSArray<NSNumber *> *requestedScopes = options[@"requestedScopes"];
    NSNumber *requestedOperation = options[@"requestedOperation"];

    request.requestedScopes = [EXAppleAuthenticationMappings importScopes:requestedScopes];
    request.requestedOperation = [EXAppleAuthenticationMappings importOperation:requestedOperation];

    if (options[@"user"]) {
      request.user = options[@"user"];
    }
    if (options[@"state"]) {
      request.state = options[@"state"];
    }
    
    ASAuthorizationController* ctrl = [[ASAuthorizationController alloc] initWithAuthorizationRequests:@[request]];
    ctrl.presentationContextProvider = self;
    ctrl.delegate = self;
    [ctrl performRequests];
  } else {
    reject(@"ERR_APPLE_AUTHENTICATION_UNAVAILABLE", @"This feature is not available on your iPhone.", nil);
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
        return reject(@"ERR_APPLE_AUTHENTICATION", [error localizedDescription], nil);
      }
      resolve([EXAppleAuthenticationMappings exportCredentialState:credentialState]);
    }];
  } else {
    reject(@"ERR_APPLE_AUTHENTICATION_UNAVAILABLE", @"This feature is not available on your iPhone.", nil);
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
                         @"fullName": [self _serializeFullName:credential.fullName],
                         @"email": UMNullIfNil(credential.email),
                         @"user": credential.user,
                         @"authorizedScopes": credential.authorizedScopes,
                         @"realUserStatus": @(credential.realUserStatus),
                         @"state": UMNullIfNil(credential.state),
                         @"authorizationCode": UMNullIfNil(credential.authorizationCode),
                         @"identityToken": UMNullIfNil(credential.identityToken),
                         @"type": @"success"
                         };
  if (_promiseResolve) {
    _promiseResolve(user);
  }
  _promiseResolve = nil;
  _promiseReject = nil;
}

- (void)authorizationController:(ASAuthorizationController *)controller
           didCompleteWithError:(NSError *)error API_AVAILABLE(ios(13.0))
{
  if (error.code == 1001) {
    // user canceled authentication attempt
    if (_promiseResolve) {
      _promiseResolve(@{@"type": @"cancel"});
    }
  } else if (_promiseReject) {
    _promiseReject(@"ERR_APPLE_AUTHENTICATION", error.description, error);
  }
  _promiseResolve = nil;
  _promiseReject = nil;
}

- (NSDictionary *)_serializeFullName:(NSPersonNameComponents *)nameComponents
{
  return @{
           @"namePrefix": UMNullIfNil(nameComponents.namePrefix),
           @"givenName": UMNullIfNil(nameComponents.givenName),
           @"middleName": UMNullIfNil(nameComponents.middleName),
           @"familyName": UMNullIfNil(nameComponents.familyName),
           @"nameSuffix": UMNullIfNil(nameComponents.nameSuffix),
           @"nickname": UMNullIfNil(nameComponents.nickname)
           };
}

@end
