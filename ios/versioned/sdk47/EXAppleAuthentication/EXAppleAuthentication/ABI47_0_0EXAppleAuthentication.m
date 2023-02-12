// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXAppleAuthentication/ABI47_0_0EXAppleAuthentication.h>
#import <ABI47_0_0EXAppleAuthentication/ABI47_0_0EXAppleAuthenticationRequest.h>
#import <ABI47_0_0EXAppleAuthentication/ABI47_0_0EXAppleAuthenticationMappings.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXErrorCodes.h>

static NSString *const ABI47_0_0EXAppleIDCredentialRevokedEvent = @"Expo.appleIdCredentialRevoked";

@interface ABI47_0_0EXAppleAuthentication ()

@property (nonatomic, weak) ABI47_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI47_0_0EXAppleAuthentication

ABI47_0_0EX_EXPORT_MODULE(ExpoAppleAuthentication);

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI47_0_0EXAppleIDCredentialRevokedEvent];
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
  id<ABI47_0_0EXEventEmitterService> eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXEventEmitterService)];
  [eventEmitter sendEventWithName:ABI47_0_0EXAppleIDCredentialRevokedEvent body:@{}];
}

ABI47_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(ABI47_0_0EXPromiseResolveBlock)resolve
                            rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    resolve(@(YES));
  } else {
    resolve(@(NO));
  }
}

ABI47_0_0EX_EXPORT_METHOD_AS(requestAsync,
                    requestAsync:(NSDictionary *)options
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    [self requestWithOptions:options
                    resolver:resolve
                    rejecter:reject];
  } else {
    reject(@"ERR_APPLE_AUTHENTICATION_UNAVAILABLE", @"Apple authentication is not supported on this device.", nil);
  }
}

ABI47_0_0EX_EXPORT_METHOD_AS(getCredentialStateAsync,
                    getCredentialStateAsync:(NSString *)userID
                                   resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                                   rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  if (@available(iOS 13.0, *)) {
    ASAuthorizationAppleIDProvider *appleIDProvider = [[ASAuthorizationAppleIDProvider alloc] init];
    [appleIDProvider getCredentialStateForUserID:userID
                                      completion:^(ASAuthorizationAppleIDProviderCredentialState credentialState,
                                                   NSError  *_Nullable error) {
      if (error) {
        return reject(@"ERR_APPLE_AUTHENTICATION_CREDENTIAL", error.localizedDescription, nil);
      }
      resolve([ABI47_0_0EXAppleAuthenticationMappings exportCredentialState:credentialState]);
    }];
  } else {
    reject(@"ERR_APPLE_AUTHENTICATION_UNAVAILABLE", @"Apple authentication is not supported on this device.", nil);
  }
}

#pragma mark - helpers

- (void)requestWithOptions:(NSDictionary *)options
                  resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                  rejecter:(ABI47_0_0EXPromiseRejectBlock)reject API_AVAILABLE(ios(13.0))
{
  ASAuthorizationProviderAuthorizationOperation operation = [ABI47_0_0EXAppleAuthenticationMappings importOperation:options[@"requestedOperation"]];
  __block ABI47_0_0EXAppleAuthenticationRequest *request = [ABI47_0_0EXAppleAuthenticationRequest performOperation:operation
                                                                                     withOptions:options
                                                                                    withCallback:^(NSDictionary *response, NSError *error) {
    if (error) {
      if (error.code == 1001) {
        // User canceled authentication attempt.
        reject(ABI47_0_0EXErrorCodeCanceled, @"The Apple authentication request has been canceled by the user.", nil);
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
