// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKLoginManagerLogger.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLoginError.h"
#import "FBSDKLoginManagerLoginResult+Internal.h"
#import "FBSDKLoginUtility.h"

NSString *const FBSDKLoginManagerLoggerAuthMethod_Native = @"fb_application_web_auth";
NSString *const FBSDKLoginManagerLoggerAuthMethod_Browser = @"browser_auth";
NSString *const FBSDKLoginManagerLoggerAuthMethod_SFVC = @"sfvc_auth";

static NSString *const FBSDKLoginManagerLoggingClientStateKey = @"state";
static NSString *const FBSDKLoginManagerLoggingClientStateIsClientState = @"com.facebook.sdk_client_state";

static NSString *const FBSDKLoginManagerLoggerParamIdentifierKey = @"0_auth_logger_id";
static NSString *const FBSDKLoginManagerLoggerParamTimestampKey = @"1_timestamp_ms";
static NSString *const FBSDKLoginManagerLoggerParamResultKey = @"2_result";
static NSString *const FBSDKLoginManagerLoggerParamAuthMethodKey = @"3_method";
static NSString *const FBSDKLoginManagerLoggerParamErrorCodeKey = @"4_error_code";
static NSString *const FBSDKLoginManagerLoggerParamErrorMessageKey = @"5_error_message";
static NSString *const FBSDKLoginManagerLoggerParamExtrasKey = @"6_extras";
static NSString *const FBSDKLoginManagerLoggerParamLoggingTokenKey = @"7_logging_token";

static NSString *const FBSDKLoginManagerLoggerValueEmpty = @"";

static NSString *const FBSDKLoginManagerLoggerResultSuccessString = @"success";
static NSString *const FBSDKLoginManagerLoggerResultCancelString = @"cancelled";
static NSString *const FBSDKLoginManagerLoggerResultErrorString = @"error";
static NSString *const FBSDKLoginManagerLoggerResultSkippedString = @"skipped";

static NSString *const FBSDKLoginManagerLoggerTryNative = @"tryFBAppAuth";
static NSString *const FBSDKLoginManagerLoggerTryBrowser = @"trySafariAuth";

@implementation FBSDKLoginManagerLogger
{
@private
  NSString *_identifier;
  NSMutableDictionary *_extras;

  NSString *_lastResult;
  NSError *_lastError;

  NSString *_authMethod;
  NSString *_loggingToken;
}

+ (FBSDKLoginManagerLogger *)loggerFromParameters:(NSDictionary *)parameters
{
  NSDictionary<id, id> *clientState = [FBSDKBasicUtility objectForJSONString:parameters[FBSDKLoginManagerLoggingClientStateKey] error:NULL];

  id isClientState = clientState[FBSDKLoginManagerLoggingClientStateIsClientState];
  if ([isClientState isKindOfClass:[NSNumber class]] && [isClientState boolValue]) {
    FBSDKLoginManagerLogger *logger = [[self alloc] initWithLoggingToken:nil];
    if (logger != nil) {
      logger->_identifier = clientState[FBSDKLoginManagerLoggerParamIdentifierKey];
      logger->_authMethod = clientState[FBSDKLoginManagerLoggerParamAuthMethodKey];
      logger->_loggingToken = clientState[FBSDKLoginManagerLoggerParamLoggingTokenKey];
      return logger;
    }
  }
  return nil;
}

- (instancetype)initWithLoggingToken:(NSString *)loggingToken
{
  if ((self = [super init]) != nil) {
    _identifier = [NSUUID UUID].UUIDString;
    _extras = [NSMutableDictionary dictionary];
    _loggingToken = [loggingToken copy];
  }
  return self;
}

- (void)startSessionForLoginManager:(FBSDKLoginManager *)loginManager
{
  BOOL isReauthorize = ([FBSDKAccessToken currentAccessToken] != nil);
  BOOL willTryNative = NO;
  BOOL willTryBrowser = NO;
  NSString *behaviorString = nil;

  switch (loginManager.loginBehavior) {
    case FBSDKLoginBehaviorBrowser:
      willTryBrowser = YES;
      behaviorString = @"FBSDKLoginBehaviorBrowser";
      break;
  }

  [_extras addEntriesFromDictionary:@{
    FBSDKLoginManagerLoggerTryNative : @(willTryNative),
    FBSDKLoginManagerLoggerTryBrowser : @(willTryBrowser),
    @"isReauthorize" : @(isReauthorize),
    @"login_behavior" : behaviorString,
    @"default_audience" : [FBSDKLoginUtility stringForAudience:loginManager.defaultAudience],
    @"permissions" : [loginManager.requestedPermissions.allObjects componentsJoinedByString:@","] ?: @""
  }];

  [self logEvent:FBSDKAppEventNameFBSessionAuthStart params:[self _parametersForNewEvent]];
}

- (void)endSession
{
    [self logEvent:FBSDKAppEventNameFBSessionAuthEnd result:_lastResult error:_lastError];
}

- (void)startAuthMethod:(NSString *)authMethod
{
  _authMethod = [authMethod copy];
  [self logEvent:FBSDKAppEventNameFBSessionAuthMethodStart params:[self _parametersForNewEvent]];
}

- (void)endLoginWithResult:(FBSDKLoginManagerLoginResult *)result error:(NSError *)error
{
  NSString *resultString = @"";

  if (error != nil) {
    resultString = FBSDKLoginManagerLoggerResultErrorString;
  } else if (result.isCancelled) {
    resultString = FBSDKLoginManagerLoggerResultCancelString;
  } else if (result.isSkipped) {
    resultString = FBSDKLoginManagerLoggerResultSkippedString;
  } else if (result.token) {
    resultString = FBSDKLoginManagerLoggerResultSuccessString;
    if (result.declinedPermissions.count) {
      _extras[@"declined_permissions"] = [result.declinedPermissions.allObjects componentsJoinedByString:@","];
    }
  }

  _lastResult = resultString;
  _lastError = error;
  [_extras addEntriesFromDictionary:result.loggingExtras];

  [self logEvent:FBSDKAppEventNameFBSessionAuthMethodEnd result:resultString error:error];
}

- (NSDictionary *)parametersWithTimeStampAndClientState:(NSDictionary *)loginParams forAuthMethod:(NSString *)authMethod
{
  NSMutableDictionary *params = [loginParams mutableCopy];

  NSTimeInterval timeValue = (NSTimeInterval)FBSDKMonotonicTimeGetCurrentSeconds();
  NSString *e2eTimestampString = [FBSDKBasicUtility JSONStringForObject:@{ @"init" : @(timeValue) }
                                                                     error:NULL
                                                      invalidObjectHandler:NULL];
  params[@"e2e"] = e2eTimestampString;

  NSDictionary<id, id> *existingState = [FBSDKBasicUtility objectForJSONString:params[FBSDKLoginManagerLoggingClientStateKey] error:NULL];
  params[FBSDKLoginManagerLoggingClientStateKey] = [self clientStateForAuthMethod:authMethod andExistingState:existingState];

  return params;
}

- (void)willAttemptAppSwitchingBehavior
{
  NSString *defaultUrlScheme = [NSString stringWithFormat:@"fb%@%@", [FBSDKSettings appID], [FBSDKSettings appURLSchemeSuffix] ?: @""];
  BOOL isURLSchemeRegistered = [FBSDKInternalUtility isRegisteredURLScheme:defaultUrlScheme];

  BOOL isFacebookAppCanOpenURLSchemeRegistered = [FBSDKInternalUtility isRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_FACEBOOK];
  BOOL isMessengerAppCanOpenURLSchemeRegistered = [FBSDKInternalUtility isRegisteredCanOpenURLScheme:FBSDK_CANOPENURL_MESSENGER];

  [_extras addEntriesFromDictionary:@{
    @"isURLSchemeRegistered" : @(isURLSchemeRegistered),
    @"isFacebookAppCanOpenURLSchemeRegistered" : @(isFacebookAppCanOpenURLSchemeRegistered),
    @"isMessengerAppCanOpenURLSchemeRegistered" : @(isMessengerAppCanOpenURLSchemeRegistered),
  }];
}

- (void)systemAuthDidShowDialog:(BOOL)didShowDialog isUnTOSedDevice:(BOOL)isUnTOSedDevice
{
  [_extras addEntriesFromDictionary:@{
    @"isUntosedDevice" : @(isUnTOSedDevice),
    @"dialogShown" : @(didShowDialog),
  }];
}

- (void)logNativeAppDialogResult:(BOOL)result dialogDuration:(NSTimeInterval)dialogDuration
{
  NSOperatingSystemVersion iOS10Version = { .majorVersion = 10, .minorVersion = 0, .patchVersion = 0 };
  if ([FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS10Version]) {
    _extras[@"native_app_login_dialog_duration"] = @(dialogDuration);
    _extras[@"native_app_login_dialog_result"] = @(result);
    [self logEvent:FBSDKAppEventNameFBSessionFASLoginDialogResult params:[self _parametersForNewEvent]];
  }
}

#pragma mark - Private

- (NSString *)clientStateForAuthMethod:(NSString *)authMethod andExistingState:(NSDictionary *)existingState
{
  NSDictionary *clientState = @{
                                FBSDKLoginManagerLoggerParamAuthMethodKey: authMethod ?: @"",
                                FBSDKLoginManagerLoggerParamIdentifierKey: _identifier,
                                FBSDKLoginManagerLoggingClientStateIsClientState: @YES,
  };

  if (existingState) {
    NSMutableDictionary *mutableState = [clientState mutableCopy];
    [mutableState addEntriesFromDictionary:existingState];
    clientState = mutableState;
  }

  return [FBSDKBasicUtility JSONStringForObject:clientState error:NULL invalidObjectHandler:NULL];
}

- (NSMutableDictionary *)_parametersForNewEvent
{
    NSMutableDictionary *eventParameters = [[NSMutableDictionary alloc] init];

    // NOTE: We ALWAYS add all params to each event, to ensure predictable mapping on the backend.
    eventParameters[FBSDKLoginManagerLoggerParamIdentifierKey] = _identifier ?: FBSDKLoginManagerLoggerValueEmpty;
    eventParameters[FBSDKLoginManagerLoggerParamTimestampKey] = @(round(1000 * [NSDate date].timeIntervalSince1970));
    eventParameters[FBSDKLoginManagerLoggerParamResultKey] = FBSDKLoginManagerLoggerValueEmpty;
    [FBSDKBasicUtility dictionary:eventParameters setObject:_authMethod forKey:FBSDKLoginManagerLoggerParamAuthMethodKey];
    eventParameters[FBSDKLoginManagerLoggerParamErrorCodeKey] = FBSDKLoginManagerLoggerValueEmpty;
    eventParameters[FBSDKLoginManagerLoggerParamErrorMessageKey] = FBSDKLoginManagerLoggerValueEmpty;
    eventParameters[FBSDKLoginManagerLoggerParamExtrasKey] = FBSDKLoginManagerLoggerValueEmpty;
    eventParameters[FBSDKLoginManagerLoggerParamLoggingTokenKey] = _loggingToken ?: FBSDKLoginManagerLoggerValueEmpty;

    return eventParameters;
}

- (void)logEvent:(NSString *)eventName params:(NSMutableDictionary *)params
{
  if (_identifier) {
    NSString *extrasJSONString = [FBSDKBasicUtility JSONStringForObject:_extras
                                                                     error:NULL
                                                      invalidObjectHandler:NULL];
    if (extrasJSONString) {
        params[FBSDKLoginManagerLoggerParamExtrasKey] = extrasJSONString;
    }
    [_extras removeAllObjects];

    [FBSDKAppEvents logInternalEvent:eventName
                          parameters:params
                  isImplicitlyLogged:YES];
  }
}

- (void)logEvent:(NSString *)eventName result:(NSString *)result error:(NSError *)error
{
  NSMutableDictionary *params = [self _parametersForNewEvent];

  params[FBSDKLoginManagerLoggerParamResultKey] = result;

  if ([error.domain isEqualToString:FBSDKErrorDomain] || [error.domain isEqualToString:FBSDKLoginErrorDomain]) {
    // tease apart the structure.

    // first see if there is an explicit message in the error's userInfo. If not, default to the reason,
    // which is less useful.
    NSString *value = error.userInfo[@"error_message"] ?: error.userInfo[FBSDKErrorLocalizedDescriptionKey];
    [FBSDKBasicUtility dictionary:params setObject:value forKey:FBSDKLoginManagerLoggerParamErrorMessageKey];

    value = error.userInfo[FBSDKGraphRequestErrorGraphErrorCodeKey] ?: [NSString stringWithFormat:@"%ld", (long)error.code];
    [FBSDKBasicUtility dictionary:params setObject:value forKey:FBSDKLoginManagerLoggerParamErrorCodeKey];

    NSError *innerError = error.userInfo[NSUnderlyingErrorKey];
    if (innerError != nil) {
      value = innerError.userInfo[@"error_message"] ?: innerError.userInfo[NSLocalizedDescriptionKey];
      [FBSDKBasicUtility dictionary:_extras setObject:value forKey:@"inner_error_message"];

      value = innerError.userInfo[FBSDKGraphRequestErrorGraphErrorCodeKey] ?: [NSString stringWithFormat:@"%ld", (long)innerError.code];
      [FBSDKBasicUtility dictionary:_extras setObject:value forKey:@"inner_error_code"];
    }
  } else if (error) {
    params[FBSDKLoginManagerLoggerParamErrorCodeKey] = @(error.code);
    params[FBSDKLoginManagerLoggerParamErrorMessageKey] = error.localizedDescription;
  }

  [self logEvent:eventName params:params];
}

@end
