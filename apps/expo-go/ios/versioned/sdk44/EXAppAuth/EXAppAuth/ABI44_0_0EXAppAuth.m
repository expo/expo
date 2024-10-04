// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXAppAuth/ABI44_0_0EXAppAuth.h>
#import <AppAuth/AppAuth.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilitiesInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilities.h>
#import <ABI44_0_0EXAppAuth/ABI44_0_0EXAppAuth+JSON.h>
#import <ABI44_0_0EXAppAuth/ABI44_0_0EXAppAuthSessionsManager.h>

static NSString *const ABI44_0_0EXAppAuthError = @"ERR_APP_AUTH";

@interface ABI44_0_0EXAppAuth ()

@property (nonatomic, weak) ABI44_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI44_0_0EXUtilitiesInterface> utilities;
@property (nonatomic, weak) id<ABI44_0_0EXAppAuthSessionsManagerInterface> sessionsManager;

@end

@implementation ABI44_0_0EXAppAuth

#pragma mark - Expo

ABI44_0_0EX_EXPORT_MODULE(ExpoAppAuth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _sessionsManager = [moduleRegistry getSingletonModuleForName:@"AppAuthSessionsManager"];
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXUtilitiesInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"OAuthRedirect": ABI44_0_0EXNullIfNil([self _getOAuthRedirect]),
           @"URLSchemes": ABI44_0_0EXNullIfNil([[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"]),
           };
}

ABI44_0_0EX_EXPORT_METHOD_AS(executeAsync,
                    executeAsync:(NSDictionary *)options
                    resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  BOOL isRefresh = [options[@"isRefresh"] boolValue];
  NSDictionary *serviceConfiguration = options[@"serviceConfiguration"];
  if (serviceConfiguration) {
    OIDServiceConfiguration *service = [self _createServiceConfiguration:serviceConfiguration];
    if (isRefresh) {
      [self _refreshWithConfiguration:service options:options resolve:resolve reject:reject];
    } else {
      [self _authorizeWithConfiguration:service options:options resolve:resolve reject:reject];
    }
  } else {
    NSString *issuer = options[@"issuer"];
    OIDDiscoveryCallback callback = [self _getCallback:options isRefresh:isRefresh resolver:resolve rejecter:reject];
    [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer] completion:callback];
  }
}

#pragma mark - Private

- (NSArray *)_getOAuthRedirect
{
  // Get the Google redirect scheme from Info.plist.
  NSArray *urlTypes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"];
  __block NSArray *urlSchemes;
  [urlTypes enumerateObjectsUsingBlock:^(id _Nonnull urlType, NSUInteger idx,  BOOL * _Nonnull stop) {
    if ([[urlType objectForKey:@"CFBundleURLName"] isEqualToString:@"OAuthRedirect"]) {
      urlSchemes = [(NSDictionary *)urlType objectForKey:@"CFBundleURLSchemes"];
      *stop = YES;
    }
  }];
  return urlSchemes;
}

- (OIDServiceConfiguration *)_createServiceConfiguration:(NSDictionary *)serviceConfiguration {
  NSURL *authorizationEndpoint = [NSURL URLWithString:[serviceConfiguration objectForKey:@"authorizationEndpoint"]];
  NSURL *tokenEndpoint = [NSURL URLWithString:[serviceConfiguration objectForKey:@"tokenEndpoint"]];
  NSURL *registrationEndpoint = [NSURL URLWithString:[serviceConfiguration objectForKey:@"registrationEndpoint"]];

  OIDServiceConfiguration *configuration =
  [[OIDServiceConfiguration alloc]
   initWithAuthorizationEndpoint:authorizationEndpoint
   tokenEndpoint:tokenEndpoint
   registrationEndpoint:registrationEndpoint];

  return configuration;
}

- (void)_authorizeWithConfiguration:(OIDServiceConfiguration *)configuration
                            options:(NSDictionary *)options
                            resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                             reject:(ABI44_0_0EXPromiseRejectBlock)reject
{
  NSArray *scopes = options[@"scopes"];
  NSDictionary *additionalParameters = options[@"additionalParameters"];
  NSURL *redirectURL = [NSURL URLWithString:options[@"redirectUrl"]];
  OIDAuthorizationRequest *request =
  [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                clientId:options[@"clientId"]
                                            clientSecret:options[@"clientSecret"]
                                                  scopes:scopes
                                             redirectURL:redirectURL
                                            responseType:OIDResponseTypeCode
                                    additionalParameters:additionalParameters];

  [ABI44_0_0EXUtilities performSynchronouslyOnMainThread:^{
    __block id<OIDExternalUserAgentSession> session;
    __weak id<ABI44_0_0EXAppAuthSessionsManagerInterface> sessionsManager = self->_sessionsManager;
    OIDAuthStateAuthorizationCallback callback = ^(OIDAuthState *_Nullable authState, NSError *_Nullable error) {
      [sessionsManager unregisterSession:session];
      if (authState) {
        NSDictionary *tokenResponse = [ABI44_0_0EXAppAuth _tokenResponseNativeToJSON:authState.lastTokenResponse request:options];
        resolve(tokenResponse);
      } else {
        ABI44_0_0EXrejectWithError(reject, error);
      }
    };

    UIViewController *presentingViewController = self->_utilities.currentViewController;
    session = [OIDAuthState authStateByPresentingAuthorizationRequest:request
                                             presentingViewController:presentingViewController
                                                             callback:callback];
    [self->_sessionsManager registerSession:session];
  }];
}

+ (NSDictionary *)_tokenResponseNativeToJSON:(OIDTokenResponse *)input request:(NSDictionary *)request
{
  NSDictionary *tokenResponse = [ABI44_0_0EXAppAuth tokenResponseNativeToJSON:input];
  NSMutableDictionary *output = [NSMutableDictionary dictionaryWithDictionary:tokenResponse];

  NSString *refreshToken;
  if (!input.refreshToken) {
    refreshToken = request[@"refreshToken"];
  } else {
    refreshToken = input.refreshToken;
  }

  [output setValue:ABI44_0_0EXNullIfNil(refreshToken) forKey:@"refreshToken"];

  return output;
}

- (void)_refreshWithConfiguration:(OIDServiceConfiguration *)configuration
                          options:(NSDictionary *)options
                          resolve:(ABI44_0_0EXPromiseResolveBlock)resolve
                           reject:(ABI44_0_0EXPromiseRejectBlock)reject {
  NSArray *scopes = options[@"scopes"];
  NSDictionary *additionalParameters = options[@"additionalParameters"];

  OIDTokenRequest *tokenRefreshRequest =
  [[OIDTokenRequest alloc] initWithConfiguration:configuration
                                       grantType:@"refresh_token"
                               authorizationCode:nil
                                     redirectURL:[NSURL URLWithString:options[@"redirectUrl"]]
                                        clientID:options[@"clientId"]
                                    clientSecret:options[@"clientSecret"]
                                          scopes:scopes
                                    refreshToken:options[@"refreshToken"]
                                    codeVerifier:nil
                            additionalParameters:additionalParameters];

  OIDTokenCallback callback = ^(OIDTokenResponse *_Nullable response, NSError *_Nullable error) {
    if (response) {
      NSDictionary *tokenResponse = [ABI44_0_0EXAppAuth _tokenResponseNativeToJSON:response request:options];
      resolve(tokenResponse);
    } else {
      ABI44_0_0EXrejectWithError(reject, error);
    }
  };
  [OIDAuthorizationService performTokenRequest:tokenRefreshRequest
                                      callback:callback];
}

- (OIDDiscoveryCallback)_getCallback:(NSDictionary *)options
                           isRefresh:(BOOL)isRefresh
                            resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                            rejecter:(ABI44_0_0EXPromiseRejectBlock)reject
{
  return ^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
    if (configuration) {
      if (isRefresh) [self _refreshWithConfiguration:configuration options:options resolve:resolve reject:reject];
      else [self _authorizeWithConfiguration:configuration options:options resolve:resolve reject:reject];
    } else {
      ABI44_0_0EXrejectWithError(reject, error);
    }
  };
}

#pragma mark - Static

// ABI44_0_0EX prefix for versioning to work smoothly
void ABI44_0_0EXrejectWithError(ABI44_0_0EXPromiseRejectBlock reject, NSError *error) {
  NSString *errorMessage = [NSString stringWithFormat:@"%@: %@", ABI44_0_0EXAppAuthError, error.localizedDescription];
  if (error.localizedFailureReason != nil && ![error.localizedFailureReason isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Reason: %@", errorMessage, error.localizedFailureReason];
  if (error.localizedRecoverySuggestion != nil && ![error.localizedRecoverySuggestion isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Try: %@", errorMessage, error.localizedRecoverySuggestion];

  NSString *errorCode = [NSString stringWithFormat:@"%ld", (long) error.code];
  reject(errorCode, errorMessage, error);
}

@end
