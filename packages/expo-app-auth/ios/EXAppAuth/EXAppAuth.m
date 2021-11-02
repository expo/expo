// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuth.h>
#import <AppAuth/AppAuth.h>
#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <ExpoModulesCore/EXUtilities.h>
#import <EXAppAuth/EXAppAuth+JSON.h>
#import <EXAppAuth/EXAppAuthSessionsManager.h>

static NSString *const EXAppAuthError = @"ERR_APP_AUTH";

@interface EXAppAuth ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;
@property (nonatomic, weak) id<EXAppAuthSessionsManagerInterface> sessionsManager;

@end

@implementation EXAppAuth

#pragma mark - Expo

EX_EXPORT_MODULE(ExpoAppAuth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _sessionsManager = [moduleRegistry getSingletonModuleForName:@"AppAuthSessionsManager"];
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"OAuthRedirect": EXNullIfNil([self _getOAuthRedirect]),
           @"URLSchemes": EXNullIfNil([[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"]),
           };
}

EX_EXPORT_METHOD_AS(executeAsync,
                    executeAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
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
                            resolve:(EXPromiseResolveBlock)resolve
                             reject:(EXPromiseRejectBlock)reject
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

  [EXUtilities performSynchronouslyOnMainThread:^{
    __block id<OIDExternalUserAgentSession> session;
    __weak id<EXAppAuthSessionsManagerInterface> sessionsManager = self->_sessionsManager;
    OIDAuthStateAuthorizationCallback callback = ^(OIDAuthState *_Nullable authState, NSError *_Nullable error) {
      [sessionsManager unregisterSession:session];
      if (authState) {
        NSDictionary *tokenResponse = [EXAppAuth _tokenResponseNativeToJSON:authState.lastTokenResponse request:options];
        resolve(tokenResponse);
      } else {
        EXrejectWithError(reject, error);
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
  NSDictionary *tokenResponse = [EXAppAuth tokenResponseNativeToJSON:input];
  NSMutableDictionary *output = [NSMutableDictionary dictionaryWithDictionary:tokenResponse];

  NSString *refreshToken;
  if (!input.refreshToken) {
    refreshToken = request[@"refreshToken"];
  } else {
    refreshToken = input.refreshToken;
  }

  [output setValue:EXNullIfNil(refreshToken) forKey:@"refreshToken"];

  return output;
}

- (void)_refreshWithConfiguration:(OIDServiceConfiguration *)configuration
                          options:(NSDictionary *)options
                          resolve:(EXPromiseResolveBlock)resolve
                           reject:(EXPromiseRejectBlock)reject {
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
      NSDictionary *tokenResponse = [EXAppAuth _tokenResponseNativeToJSON:response request:options];
      resolve(tokenResponse);
    } else {
      EXrejectWithError(reject, error);
    }
  };
  [OIDAuthorizationService performTokenRequest:tokenRefreshRequest
                                      callback:callback];
}

- (OIDDiscoveryCallback)_getCallback:(NSDictionary *)options
                           isRefresh:(BOOL)isRefresh
                            resolver:(EXPromiseResolveBlock)resolve
                            rejecter:(EXPromiseRejectBlock)reject
{
  return ^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
    if (configuration) {
      if (isRefresh) [self _refreshWithConfiguration:configuration options:options resolve:resolve reject:reject];
      else [self _authorizeWithConfiguration:configuration options:options resolve:resolve reject:reject];
    } else {
      EXrejectWithError(reject, error);
    }
  };
}

#pragma mark - Static

// EX prefix for versioning to work smoothly
void EXrejectWithError(EXPromiseRejectBlock reject, NSError *error) {
  NSString *errorMessage = [NSString stringWithFormat:@"%@: %@", EXAppAuthError, error.localizedDescription];
  if (error.localizedFailureReason != nil && ![error.localizedFailureReason isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Reason: %@", errorMessage, error.localizedFailureReason];
  if (error.localizedRecoverySuggestion != nil && ![error.localizedRecoverySuggestion isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Try: %@", errorMessage, error.localizedRecoverySuggestion];

  NSString *errorCode = [NSString stringWithFormat:@"%ld", (long) error.code];
  reject(errorCode, errorMessage, error);
}

@end
