// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppleAuthentication/EXAppleAuthentication.h>
#import <EXAppleAuthentication/EXAppleAuthenticationRequest.h>
#import <EXAppleAuthentication/EXAppleAuthenticationMappings.h>

#import <ExpoModulesCore/EXUtilities.h>
#import <ExpoModulesCore/EXErrorCodes.h>

static NSString *const EXAppleIDCredentialRevokedEvent = @"Expo.appleIdCredentialRevoked";

@interface EXAppleAuthentication ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXAppleAuthentication

EX_EXPORT_MODULE(ExpoAppleAuthentication);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXAppleIDCredentialRevokedEvent];
}

- (void)startObserving
{
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didRevokeCredential:)
                                                 name:ASAuthorizationAppleIDProviderCredentialRevokedNotification
                                               object:nil];
  }
}

- (void)stopObserving
{
  if (@available(iOS 13.0, *)) {
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:ASAuthorizationAppleIDProviderCredentialRevokedNotification
                                                  object:nil];
  }
}

- (void)didRevokeCredential:(NSNotification *)notification
{
  id<EXEventEmitterService> eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  [eventEmitter sendEventWithName:EXAppleIDCredentialRevokedEvent body:@{}];
}

EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(EXPromiseResolveBlock)resolve
                            rejecter:(EXPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

EX_EXPORT_METHOD_AS(requestAsync,
                    requestAsync:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    [self requestWithOptions:options
                    resolver:resolve
                    rejecter:reject];
  } else {
    reject(@"ERR_APPLE_AUTHENTICATION_UNAVAILABLE", @"Apple authentication is not supported on this device.", nil);
  }
}

EX_EXPORT_METHOD_AS(getCredentialStateAsync,
                    getCredentialStateAsync:(NSString *)userID
                                   resolver:(EXPromiseResolveBlock)resolve
                                   rejecter:(EXPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    ASAuthorizationAppleIDProvider *appleIDProvider = [[ASAuthorizationAppleIDProvider alloc] init];
    [appleIDProvider getCredentialStateForUserID:userID
                                      completion:^(ASAuthorizationAppleIDProviderCredentialState credentialState,
                                                   NSError  *_Nullable error) {
      if (error) {
        return reject(@"ERR_APPLE_AUTHENTICATION_CREDENTIAL", error.localizedDescription, nil);
      }
      resolve([EXAppleAuthenticationMappings exportCredentialState:credentialState]);
    }];
  } else {
    reject(@"ERR_APPLE_AUTHENTICATION_UNAVAILABLE", @"Apple authentication is not supported on this device.", nil);
  }
}

#pragma mark - helpers

- (void)requestWithOptions:(NSDictionary *)options
                  resolver:(EXPromiseResolveBlock)resolve
                  rejecter:(EXPromiseRejectBlock)reject API_AVAILABLE(ios(13.0))
{
  ASAuthorizationProviderAuthorizationOperation operation = [EXAppleAuthenticationMappings importOperation:options[@"requestedOperation"]];
  __block EXAppleAuthenticationRequest *request = [EXAppleAuthenticationRequest performOperation:operation
                                                                                     withOptions:options
                                                                                    withCallback:^(NSDictionary *response, NSError *error) {
    if (error) {
      if (error.code == 1001) {
        // User canceled authentication attempt.
        reject(EXErrorCodeCanceled, @"The Apple authentication request has been canceled by the user.", nil);
      } else {
        reject(@"ERR_APPLE_AUTHENTICATION_REQUEST_FAILED", error.localizedDescription, nil);
      }
    } else {
      resolve(response);
    }
    request = nil;
  }];
}

@end
