// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuth.h>
#import <AppAuth/AppAuth.h>
#import <EXCore/EXUtilitiesInterface.h>
#import <EXCore/EXUtilities.h>
#import <EXAppAuth/EXAppAuth+JSON.h>

static NSString *const EXAppAuthError = @"ERR_APP_AUTH";

@interface EXAppAuth() {
  id<OIDExternalUserAgentSession> session;
}

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;

@end

@implementation EXAppAuth

static EXAppAuth *shared = nil;

+ (nonnull instancetype)instance {
  return shared;
}

- (id)init {
  self = [super init];
  if (self != nil) {
    shared = self;
  }
  return self;
}

#pragma mark - Expo

EX_EXPORT_MODULE(ExpoAppAuth);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
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
    __weak typeof(self) weakSelf = self;
    
    OIDAuthStateAuthorizationCallback callback = ^(OIDAuthState *_Nullable authState, NSError *_Nullable error) {
      typeof(self) strongSelf = weakSelf;
      if (strongSelf != nil) {
        // Destroy the current session
        strongSelf->session = nil;
      }
      if (authState) {
        NSDictionary *tokenResponse = [EXAppAuth _tokenResponseNativeToJSON:authState.lastTokenResponse request:options];
        resolve(tokenResponse);
      } else {
        EXrejectWithError(reject, error);
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
    self->session = [OIDAuthState authStateByPresentingAuthorizationRequest:request
                                                   presentingViewController:presentingViewController
                                                                   callback:callback];
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
    refreshToken = input.accessToken;
  }
  
  [output setValue:@"refreshToken" forKey:EXnullIfEmpty(refreshToken)];
  
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

#pragma mark - Public

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options {
  return [session resumeExternalUserAgentFlowWithURL:url];
}

#pragma mark - Static

// EX prefix for versioning to work smoothly
void EXrejectWithError(EXPromiseRejectBlock reject, NSError *error) {
  NSString *errorMessage = [NSString stringWithFormat:@"%@: %@", EXAppAuthError, error.localizedDescription];
  if (error.localizedFailureReason != nil && ![error.localizedFailureReason isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Reason: %@", errorMessage, error.localizedFailureReason];
  if (error.localizedRecoverySuggestion != nil && ![error.localizedRecoverySuggestion isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Try: %@", errorMessage, error.localizedRecoverySuggestion];
  
  NSString *errorCode = [NSString stringWithFormat:@"%ld", error.code];
  reject(errorCode, errorMessage, error);
}

@end

