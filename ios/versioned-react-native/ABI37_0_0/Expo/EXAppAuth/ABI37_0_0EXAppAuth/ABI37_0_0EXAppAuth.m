// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXAppAuth/ABI37_0_0EXAppAuth.h>
#import <AppAuth/AppAuth.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilitiesInterface.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMUtilities.h>
#import <ABI37_0_0EXAppAuth/ABI37_0_0EXAppAuth+JSON.h>
#import <ABI37_0_0EXAppAuth/ABI37_0_0EXAppAuthSessionsManager.h>

static NSString *const ABI37_0_0EXAppAuthError = @"ERR_APP_AUTH";

@interface ABI37_0_0EXAppAuth ()

@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI37_0_0UMUtilitiesInterface> utilities;
@property (nonatomic, weak) id<ABI37_0_0EXAppAuthSessionsManagerInterface> sessionsManager;

@end

@implementation ABI37_0_0EXAppAuth

#pragma mark - Expo

ABI37_0_0UM_EXPORT_MODULE(ExpoAppAuth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _sessionsManager = [moduleRegistry getSingletonModuleForName:@"AppAuthSessionsManager"];
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMUtilitiesInterface)];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"OAuthRedirect": ABI37_0_0UMNullIfNil([self _getOAuthRedirect]),
           @"URLSchemes": ABI37_0_0UMNullIfNil([[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"]),
           };
}

ABI37_0_0UM_EXPORT_METHOD_AS(executeAsync,
                    executeAsync:(NSDictionary *)options
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
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
                            resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                             reject:(ABI37_0_0UMPromiseRejectBlock)reject
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

  [ABI37_0_0UMUtilities performSynchronouslyOnMainThread:^{
    __block id<OIDExternalUserAgentSession> session;
    __weak id<ABI37_0_0EXAppAuthSessionsManagerInterface> sessionsManager = self->_sessionsManager;
    OIDAuthStateAuthorizationCallback callback = ^(OIDAuthState *_Nullable authState, NSError *_Nullable error) {
      [sessionsManager unregisterSession:session];
      if (authState) {
        NSDictionary *tokenResponse = [ABI37_0_0EXAppAuth _tokenResponseNativeToJSON:authState.lastTokenResponse request:options];
        resolve(tokenResponse);
      } else {
        ABI37_0_0EXrejectWithError(reject, error);
      }
    };

    // On iOS < 11 presenting authorization request on currentViewController
    // resulted in freezed SFSafariViewController.
    // See issue https://github.com/google/GTMAppAuth/issues/6
    // See pull request https://github.com/openid/AppAuth-iOS/pull/73
    UIViewController *presentingViewController;
    if (@available(iOS 11.0, *)) {
      presentingViewController = self->_utilities.currentViewController;
    } else {
      presentingViewController = [[[UIApplication sharedApplication] keyWindow] rootViewController];
    }
    session = [OIDAuthState authStateByPresentingAuthorizationRequest:request
                                             presentingViewController:presentingViewController
                                                             callback:callback];
    [self->_sessionsManager registerSession:session];
  }];
}

+ (NSDictionary *)_tokenResponseNativeToJSON:(OIDTokenResponse *)input request:(NSDictionary *)request
{
  NSDictionary *tokenResponse = [ABI37_0_0EXAppAuth tokenResponseNativeToJSON:input];
  NSMutableDictionary *output = [NSMutableDictionary dictionaryWithDictionary:tokenResponse];

  NSString *refreshToken;
  if (!input.refreshToken) {
    refreshToken = request[@"refreshToken"];
  } else {
    refreshToken = input.refreshToken;
  }

  [output setValue:ABI37_0_0UMNullIfNil(refreshToken) forKey:@"refreshToken"];

  return output;
}

- (void)_refreshWithConfiguration:(OIDServiceConfiguration *)configuration
                          options:(NSDictionary *)options
                          resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                           reject:(ABI37_0_0UMPromiseRejectBlock)reject {
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
      NSDictionary *tokenResponse = [ABI37_0_0EXAppAuth _tokenResponseNativeToJSON:response request:options];
      resolve(tokenResponse);
    } else {
      ABI37_0_0EXrejectWithError(reject, error);
    }
  };
  [OIDAuthorizationService performTokenRequest:tokenRefreshRequest
                                      callback:callback];
}

- (OIDDiscoveryCallback)_getCallback:(NSDictionary *)options
                           isRefresh:(BOOL)isRefresh
                            resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                            rejecter:(ABI37_0_0UMPromiseRejectBlock)reject
{
  return ^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
    if (configuration) {
      if (isRefresh) [self _refreshWithConfiguration:configuration options:options resolve:resolve reject:reject];
      else [self _authorizeWithConfiguration:configuration options:options resolve:resolve reject:reject];
    } else {
      ABI37_0_0EXrejectWithError(reject, error);
    }
  };
}

#pragma mark - Static

// ABI37_0_0EX prefix for versioning to work smoothly
void ABI37_0_0EXrejectWithError(ABI37_0_0UMPromiseRejectBlock reject, NSError *error) {
  NSString *errorMessage = [NSString stringWithFormat:@"%@: %@", ABI37_0_0EXAppAuthError, error.localizedDescription];
  if (error.localizedFailureReason != nil && ![error.localizedFailureReason isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Reason: %@", errorMessage, error.localizedFailureReason];
  if (error.localizedRecoverySuggestion != nil && ![error.localizedRecoverySuggestion isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Try: %@", errorMessage, error.localizedRecoverySuggestion];

  NSString *errorCode = [NSString stringWithFormat:@"%ld", (long) error.code];
  reject(errorCode, errorMessage, error);
}

@end
