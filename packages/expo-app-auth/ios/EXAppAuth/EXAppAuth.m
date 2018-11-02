// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuth.h>
#import <AppAuth/AppAuth.h>
#import <EXCore/EXUtilitiesInterface.h>
#import <EXCore/EXUtilities.h>

static NSString *const EXAppAuthError = @"E_APP_AUTH";

@interface EXAppAuth() {
  id<OIDExternalUserAgentSession> session;
}
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXUtilitiesInterface> utilities;

@end

@implementation EXAppAuth

static EXAppAuth *shared = nil;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (nonnull instancetype)instance {
  return shared;
}

- (id)init {
  self = [super init];
  if (self != nil) {
    // Set static instance for use from AppDelegate
    shared = self;
  }
  return self;
}

EX_EXPORT_MODULE(ExpoAppAuth);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(EXUtilitiesInterface)];
}

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

- (NSDictionary *)constantsToExport
{
  return @{
           @"OAuthRedirect": [self _getOAuthRedirect],
           @"URLSchemes": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"]
           };
}

EX_EXPORT_METHOD_AS(executeAsync,
                    executeAsync:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  BOOL isRefresh = [options[@"isRefresh"] boolValue];
  // TODO: Bacon: Checks...
  NSDictionary *serviceConfiguration = options[@"serviceConfiguration"];
  if (serviceConfiguration) {
    OIDServiceConfiguration *service = [self createServiceConfiguration:serviceConfiguration];
    if (isRefresh) {
      [self refreshWithConfiguration:service options:options resolve:resolve reject:reject];
    } else {
      [self authorizeWithConfiguration:service options:options resolve:resolve reject:reject];
    }
  } else {
    // TODO: Bacon: Checks / Errors
    NSString *issuer = options[@"issuer"];
    OIDDiscoveryCallback callback = [self getCallback:options isRefresh:isRefresh resolver:resolve rejecter:reject];
    [OIDAuthorizationService discoverServiceConfigurationForIssuer:[NSURL URLWithString:issuer] completion:callback];
  }
}

- (OIDServiceConfiguration *)createServiceConfiguration:(NSDictionary *)serviceConfiguration {
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

- (void)authorizeWithConfiguration:(OIDServiceConfiguration *)configuration
                           options:(NSDictionary *)options
                           resolve:(EXPromiseResolveBlock)resolve
                            reject:(EXPromiseRejectBlock)reject
{
  NSArray *scopes = options[@"scopes"];
  NSDictionary *additionalParameters = options[@"additionalParameters"];
  
  OIDAuthorizationRequest *request =
  [[OIDAuthorizationRequest alloc] initWithConfiguration:configuration
                                                clientId:options[@"clientId"]
                                            clientSecret:options[@"clientSecret"]
                                                  scopes:scopes
                                             redirectURL:[NSURL URLWithString:options[@"redirectUrl"]]
                                            responseType:OIDResponseTypeCode
                                    additionalParameters:additionalParameters];

  [EXUtilities performSynchronouslyOnMainThread:^{
    __weak typeof(self) weakSelf = self;
    UIViewController *presentingViewController = self->_utilities.currentViewController;
    self->session = [OIDAuthState authStateByPresentingAuthorizationRequest:request
                                                           presentingViewController:presentingViewController
                                                                           callback:^(OIDAuthState *_Nullable authState, NSError *_Nullable error) {
                                                                             typeof(self) strongSelf = weakSelf;
                                                                             strongSelf->session = nil;
                                                                             if (authState) {
                                                                               resolve([[self class] jsonFromOIDTokenResponse:authState.lastTokenResponse request:options]);
                                                                             } else {
                                                                               rejectWithError(reject, error);
                                                                             }
                                                                           }];
  }];
}

- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options {
  return [session resumeExternalUserAgentFlowWithURL:url];
}

- (void)refreshWithConfiguration:(OIDServiceConfiguration *)configuration
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
  
  [OIDAuthorizationService performTokenRequest:tokenRefreshRequest
                                      callback:^(OIDTokenResponse *_Nullable response,
                                                 NSError *_Nullable error) {
                                        if (response) {
                                          resolve([[self class] jsonFromOIDTokenResponse:response request:options]);
                                        } else {
                                          rejectWithError(reject, error);
                                        }
                                      }];
}

- (OIDDiscoveryCallback)getCallback:(NSDictionary *)options
                          isRefresh:(BOOL)isRefresh
                           resolver:(EXPromiseResolveBlock)resolve
                           rejecter:(EXPromiseRejectBlock)reject
{
  return ^(OIDServiceConfiguration *_Nullable configuration, NSError *_Nullable error) {
    if (configuration) {
      if (isRefresh) [self refreshWithConfiguration:configuration options:options resolve:resolve reject:reject];
      else [self authorizeWithConfiguration:configuration options:options resolve:resolve reject:reject];
    } else {
      rejectWithError(reject, error);
    }
  };
}

void rejectWithError(EXPromiseRejectBlock reject, NSError *error) {
  NSString *errorMessage = [NSString stringWithFormat:@"%@: %@", EXAppAuthError, error.localizedDescription];
  if (error.localizedFailureReason != nil && ![error.localizedFailureReason isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Reason: %@", errorMessage, error.localizedFailureReason];
  if (error.localizedRecoverySuggestion != nil && ![error.localizedRecoverySuggestion isEqualToString:@""]) errorMessage = [NSString stringWithFormat:@"%@, Try: %@", errorMessage, error.localizedRecoverySuggestion];
  
  NSString *errorCode = [NSString stringWithFormat:@"%ld", error.code];
  reject(errorCode, errorMessage, error);
}

// TODO: Bacon: Move to Serialization extension.

id nullIfEmpty(NSString *input) {
  if (!input || input == nil || [input isEqualToString:@""]) {
    return [NSNull null];
  }
  return input;
}

id nullIfNil(id input) {
  if (!input || input == nil) {
    return [NSNull null];
  }
  return input;
}

+ (NSString *)jsonFromNSDate:(NSDate *)input
{
  if (!input) return nil;
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
  [dateFormatter setTimeZone:timeZone];
  [dateFormatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
  [dateFormatter setDateFormat: @"yyyy-MM-dd'T'HH:mm:ss.SSS'Z"];
  return [dateFormatter stringFromDate:input];
}

+ (NSDictionary *)jsonFromOIDTokenResponse:(OIDTokenResponse *)response request:(NSDictionary *)request
{
  if (!response) return nil;
  
  NSString *refreshToken;
  if (!response.refreshToken) {
    refreshToken = request[@"refreshToken"];
  } else {
    refreshToken = response.accessToken;
  }
  
  return @{
           @"accessToken": nullIfEmpty(response.accessToken),
           @"accessTokenExpirationDate": nullIfNil([[self class] jsonFromNSDate:response.accessTokenExpirationDate]),
           @"additionalParameters": nullIfNil(response.additionalParameters),
           @"idToken": nullIfEmpty(response.idToken),
           @"refreshToken": nullIfEmpty(refreshToken),
           @"tokenType": nullIfEmpty(response.tokenType),
           };
}

@end

