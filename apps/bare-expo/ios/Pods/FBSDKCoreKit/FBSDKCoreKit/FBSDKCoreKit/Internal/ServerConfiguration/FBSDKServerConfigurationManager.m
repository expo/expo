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

#import "FBSDKServerConfigurationManager+Internal.h"

#import <objc/runtime.h>

#import "FBSDKAppEventsUtility.h"
#import "FBSDKGraphRequest.h"
#import "FBSDKGraphRequest+Internal.h"
#import "FBSDKImageDownloader.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKServerConfiguration.h"
#import "FBSDKServerConfiguration+Internal.h"
#import "FBSDKSettings.h"

#define FBSDK_SERVER_CONFIGURATION_USER_DEFAULTS_KEY @"com.facebook.sdk:serverConfiguration%@"

#define FBSDK_SERVER_CONFIGURATION_APP_EVENTS_FEATURES_FIELD @"app_events_feature_bitmask"
#define FBSDK_SERVER_CONFIGURATION_APP_NAME_FIELD @"name"
#define FBSDK_SERVER_CONFIGURATION_DEFAULT_SHARE_MODE_FIELD @"default_share_mode"
#define FBSDK_SERVER_CONFIGURATION_DIALOG_CONFIGS_FIELD @"ios_dialog_configs"
#define FBSDK_SERVER_CONFIGURATION_DIALOG_FLOWS_FIELD @"ios_sdk_dialog_flows"
#define FBSDK_SERVER_CONFIGURATION_ERROR_CONFIGURATION_FIELD @"ios_sdk_error_categories"
#define FBSDK_SERVER_CONFIGURATION_IMPLICIT_LOGGING_ENABLED_FIELD @"supports_implicit_sdk_logging"
#define FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_ENABLED_FIELD @"gdpv4_nux_enabled"
#define FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_TEXT_FIELD @"gdpv4_nux_content"
#define FBSDK_SERVER_CONFIGURATION_SESSION_TIMEOUT_FIELD @"app_events_session_timeout"
#define FBSDK_SERVER_CONFIGURATION_LOGGIN_TOKEN_FIELD @"logging_token"
#define FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_OPTIONS_FIELD @"seamless_login"
#define FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_BOOKMARK_ICON_URL_FIELD @"smart_login_bookmark_icon_url"
#define FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_MENU_ICON_URL_FIELD @"smart_login_menu_icon_url"
#define FBSDK_SERVER_CONFIGURATION_UPDATE_MESSAGE_FIELD @"sdk_update_message"
#define FBSDK_SERVER_CONFIGURATION_EVENT_BINDINGS_FIELD  @"auto_event_mapping_ios"
#define FBSDK_SERVER_CONFIGURATION_RESTRICTIVE_PARAMS_FIELD @"restrictive_data_filter_params"
#define FBSDK_SERVER_CONFIGURATION_AAM_RULES_FIELD @"aam_rules"
#define FBSDK_SERVER_CONFIGURATION_SUGGESTED_EVENTS_SETTING_FIELD @"suggested_events_setting"
#define FBSDK_SERVER_CONFIGURATION_MONITORING_CONFIG_FIELD @"monitoringConfiguration"

@implementation FBSDKServerConfigurationManager

static NSMutableArray *_completionBlocks;
static BOOL _loadingServerConfiguration;
static FBSDKServerConfiguration *_serverConfiguration;
static NSError *_serverConfigurationError;
static NSDate *_serverConfigurationErrorTimestamp;
static const NSTimeInterval kTimeout = 4.0;
static BOOL _requeryFinishedForAppStart;

#if DEBUG
static BOOL _printedUpdateMessage;
#endif

typedef NS_OPTIONS(NSUInteger, FBSDKServerConfigurationManagerAppEventsFeatures)
{
  FBSDKServerConfigurationManagerAppEventsFeaturesNone = 0,
  FBSDKServerConfigurationManagerAppEventsFeaturesAdvertisingIDEnabled = 1 << 0,
  FBSDKServerConfigurationManagerAppEventsFeaturesImplicitPurchaseLoggingEnabled = 1 << 1,
  FBSDKServerConfigurationManagerAppEventsFeaturesCodelessEventsTriggerEnabled = 1 << 5,
  FBSDKServerConfigurationManagerAppEventsFeaturesUninstallTrackingEnabled = 1 << 7,
};

#pragma mark - Public Class Methods

+ (void)initialize
{
  if (self == [FBSDKServerConfigurationManager class]) {
    _completionBlocks = [[NSMutableArray alloc] init];
  }
}

+ (void)clearCache
{
  _serverConfiguration = nil;
  _serverConfigurationError = nil;
  _serverConfigurationErrorTimestamp = nil;
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *defaultsKey = [NSString stringWithFormat:FBSDK_SERVER_CONFIGURATION_USER_DEFAULTS_KEY, [FBSDKSettings appID]];
  [defaults removeObjectForKey:defaultsKey];
  [defaults synchronize];
}

+ (FBSDKServerConfiguration *)cachedServerConfiguration
{
  NSString *appID = [FBSDKSettings appID];
  @synchronized(self) {
    // load the server configuration if we don't have it already
    [self loadServerConfigurationWithCompletionBlock:nil];

    // use whatever configuration we have or the default
    return _serverConfiguration ?: [FBSDKServerConfiguration defaultServerConfigurationForAppID:appID];
  }
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
+ (void)loadServerConfigurationWithCompletionBlock:(FBSDKServerConfigurationBlock)completionBlock
{
  @try {
    void (^loadBlock)(void) = nil;
    NSString *appID = [FBSDKSettings appID];
    @synchronized(self) {
      // validate the cached configuration has the correct appID
      if (_serverConfiguration && ![_serverConfiguration.appID isEqualToString:appID]) {
        _serverConfiguration = nil;
        _serverConfigurationError = nil;
        _serverConfigurationErrorTimestamp = nil;
      }

      // load the configuration from NSUserDefaults
      if (!_serverConfiguration) {
        // load the defaults
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        NSString *defaultsKey = [NSString stringWithFormat:FBSDK_SERVER_CONFIGURATION_USER_DEFAULTS_KEY, appID];
        NSData *data = [defaults objectForKey:defaultsKey];
        if ([data isKindOfClass:[NSData class]]) {
          // decode the configuration
          FBSDKServerConfiguration *serverConfiguration = [NSKeyedUnarchiver unarchiveObjectWithData:data];
          if ([serverConfiguration isKindOfClass:[FBSDKServerConfiguration class]]) {
            // ensure that the configuration points to the current appID
            if ([serverConfiguration.appID isEqualToString:appID]) {
              _serverConfiguration = serverConfiguration;
            }
          }
        }
      }

      if (_requeryFinishedForAppStart
          && ((_serverConfiguration && [self _serverConfigurationTimestampIsValid:_serverConfiguration.timestamp] && _serverConfiguration.version >= FBSDKServerConfigurationVersion))) {
        // we have a valid server configuration, use that
        loadBlock = [self _wrapperBlockForLoadBlock:completionBlock];
      } else {
        // hold onto the completion block
        [FBSDKTypeUtility array:_completionBlocks addObject:[completionBlock copy]];

        // check if we are already loading
        if (!_loadingServerConfiguration) {
          // load the configuration from the network
          _loadingServerConfiguration = YES;
          FBSDKGraphRequest *request = [[self class] requestToLoadServerConfiguration:appID];

          // start request with specified timeout instead of the default 180s
          FBSDKGraphRequestConnection *requestConnection = [FBSDKGraphRequestConnection new];
          requestConnection.timeout = kTimeout;
          [requestConnection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
            _requeryFinishedForAppStart = YES;
            [self processLoadRequestResponse:result error:error appID:appID];
          }];
          [requestConnection start];
        }
      }
    }

    if (loadBlock) {
      loadBlock();
    }
  } @catch (NSException *exception) {}
}

#pragma clang diagnostic pop

#pragma mark - Internal Class Methods

+ (void)processLoadRequestResponse:(id)result error:(NSError *)error appID:(NSString *)appID
{
  @try {
    if (error) {
      [self _didProcessConfigurationFromNetwork:nil appID:appID error:error];
      return;
    }

    NSDictionary *resultDictionary = [FBSDKTypeUtility dictionaryValue:result];
    NSUInteger appEventsFeatures = [FBSDKTypeUtility unsignedIntegerValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_APP_EVENTS_FEATURES_FIELD]];
    BOOL advertisingIDEnabled = (appEventsFeatures & FBSDKServerConfigurationManagerAppEventsFeaturesAdvertisingIDEnabled) != 0;
    BOOL implicitPurchaseLoggingEnabled = (appEventsFeatures & FBSDKServerConfigurationManagerAppEventsFeaturesImplicitPurchaseLoggingEnabled) != 0;
    BOOL codelessEventsEnabled = (appEventsFeatures & FBSDKServerConfigurationManagerAppEventsFeaturesCodelessEventsTriggerEnabled) != 0;
    BOOL uninstallTrackingEnabled = (appEventsFeatures & FBSDKServerConfigurationManagerAppEventsFeaturesUninstallTrackingEnabled) != 0;
    NSString *appName = [FBSDKTypeUtility stringValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_APP_NAME_FIELD]];
    BOOL loginTooltipEnabled = [FBSDKTypeUtility boolValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_ENABLED_FIELD]];
    NSString *loginTooltipText = [FBSDKTypeUtility stringValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_TEXT_FIELD]];
    NSString *defaultShareMode = [FBSDKTypeUtility stringValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_DEFAULT_SHARE_MODE_FIELD]];
    BOOL implicitLoggingEnabled = [FBSDKTypeUtility boolValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_IMPLICIT_LOGGING_ENABLED_FIELD]];
    NSDictionary *dialogConfigurations = [FBSDKTypeUtility dictionaryValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_DIALOG_CONFIGS_FIELD]];
    dialogConfigurations = [self _parseDialogConfigurations:dialogConfigurations];
    NSDictionary *dialogFlows = [FBSDKTypeUtility dictionaryValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_DIALOG_FLOWS_FIELD]];
    FBSDKErrorConfiguration *errorConfiguration = [[FBSDKErrorConfiguration alloc] initWithDictionary:nil];
    [errorConfiguration parseArray:resultDictionary[FBSDK_SERVER_CONFIGURATION_ERROR_CONFIGURATION_FIELD]];
    NSTimeInterval sessionTimeoutInterval = [FBSDKTypeUtility timeIntervalValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_SESSION_TIMEOUT_FIELD]];
    NSString *loggingToken = [FBSDKTypeUtility stringValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_LOGGIN_TOKEN_FIELD]];
    FBSDKServerConfigurationSmartLoginOptions smartLoginOptions = [FBSDKTypeUtility integerValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_OPTIONS_FIELD]];
    NSURL *smartLoginBookmarkIconURL = [FBSDKTypeUtility URLValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_BOOKMARK_ICON_URL_FIELD]];
    NSURL *smartLoginMenuIconURL = [FBSDKTypeUtility URLValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_MENU_ICON_URL_FIELD]];
    NSString *updateMessage = [FBSDKTypeUtility stringValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_UPDATE_MESSAGE_FIELD]];
    NSArray *eventBindings = [FBSDKTypeUtility arrayValue:resultDictionary[FBSDK_SERVER_CONFIGURATION_EVENT_BINDINGS_FIELD]];
    NSDictionary<NSString *, id> *restrictiveParams = [FBSDKBasicUtility objectForJSONString:resultDictionary[FBSDK_SERVER_CONFIGURATION_RESTRICTIVE_PARAMS_FIELD] error:nil];
    NSDictionary<NSString *, id> *AAMRules = [FBSDKBasicUtility objectForJSONString:resultDictionary[FBSDK_SERVER_CONFIGURATION_AAM_RULES_FIELD] error:nil];
    NSDictionary<NSString *, id> *suggestedEventsSetting = [FBSDKBasicUtility objectForJSONString:resultDictionary[FBSDK_SERVER_CONFIGURATION_SUGGESTED_EVENTS_SETTING_FIELD] error:nil];
    FBSDKServerConfiguration *serverConfiguration = [[FBSDKServerConfiguration alloc] initWithAppID:appID
                                                                                            appName:appName
                                                                                loginTooltipEnabled:loginTooltipEnabled
                                                                                   loginTooltipText:loginTooltipText
                                                                                   defaultShareMode:defaultShareMode
                                                                               advertisingIDEnabled:advertisingIDEnabled
                                                                             implicitLoggingEnabled:implicitLoggingEnabled
                                                                     implicitPurchaseLoggingEnabled:implicitPurchaseLoggingEnabled
                                                                              codelessEventsEnabled:codelessEventsEnabled
                                                                           uninstallTrackingEnabled:uninstallTrackingEnabled
                                                                               dialogConfigurations:dialogConfigurations
                                                                                        dialogFlows:dialogFlows
                                                                                          timestamp:[NSDate date]
                                                                                 errorConfiguration:errorConfiguration
                                                                             sessionTimeoutInterval:sessionTimeoutInterval
                                                                                           defaults:NO
                                                                                       loggingToken:loggingToken
                                                                                  smartLoginOptions:smartLoginOptions
                                                                          smartLoginBookmarkIconURL:smartLoginBookmarkIconURL
                                                                              smartLoginMenuIconURL:smartLoginMenuIconURL
                                                                                      updateMessage:updateMessage
                                                                                      eventBindings:eventBindings
                                                                                  restrictiveParams:restrictiveParams
                                                                                           AAMRules:AAMRules
                                                                             suggestedEventsSetting:suggestedEventsSetting];
  #if TARGET_OS_TV
    // don't download icons more than once a day.
    static const NSTimeInterval kSmartLoginIconsTTL = 60 * 60 * 24;

    BOOL smartLoginEnabled = (smartLoginOptions & FBSDKServerConfigurationSmartLoginOptionsEnabled);
    // for TVs go ahead and prime the images
    if (smartLoginEnabled
        && smartLoginMenuIconURL
        && smartLoginBookmarkIconURL) {
      [[FBSDKImageDownloader sharedInstance] downloadImageWithURL:serverConfiguration.smartLoginBookmarkIconURL
                                                              ttl:kSmartLoginIconsTTL
                                                       completion:nil];
      [[FBSDKImageDownloader sharedInstance] downloadImageWithURL:serverConfiguration.smartLoginMenuIconURL
                                                              ttl:kSmartLoginIconsTTL
                                                       completion:nil];
    }
  #endif
    [self _didProcessConfigurationFromNetwork:serverConfiguration appID:appID error:nil];
  } @catch (NSException *exception) {}
}

+ (FBSDKGraphRequest *)requestToLoadServerConfiguration:(NSString *)appID
{
  NSOperatingSystemVersion operatingSystemVersion = [FBSDKInternalUtility operatingSystemVersion];
  NSString *osVersion = [NSString stringWithFormat:@"%ti.%ti.%ti",
                         operatingSystemVersion.majorVersion,
                         operatingSystemVersion.minorVersion,
                         operatingSystemVersion.patchVersion];
  NSString *dialogFlowsField = [NSString stringWithFormat:@"%@.os_version(%@)",
                                FBSDK_SERVER_CONFIGURATION_DIALOG_FLOWS_FIELD,
                                osVersion];
  NSArray *fields = @[FBSDK_SERVER_CONFIGURATION_APP_EVENTS_FEATURES_FIELD,
                      FBSDK_SERVER_CONFIGURATION_APP_NAME_FIELD,
                      FBSDK_SERVER_CONFIGURATION_DEFAULT_SHARE_MODE_FIELD,
                      FBSDK_SERVER_CONFIGURATION_DIALOG_CONFIGS_FIELD,
                      dialogFlowsField,
                      FBSDK_SERVER_CONFIGURATION_ERROR_CONFIGURATION_FIELD,
                      FBSDK_SERVER_CONFIGURATION_IMPLICIT_LOGGING_ENABLED_FIELD,
                      FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_ENABLED_FIELD,
                      FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_TEXT_FIELD,
                      FBSDK_SERVER_CONFIGURATION_SESSION_TIMEOUT_FIELD,
                      FBSDK_SERVER_CONFIGURATION_LOGGIN_TOKEN_FIELD,
                      FBSDK_SERVER_CONFIGURATION_RESTRICTIVE_PARAMS_FIELD,
                      FBSDK_SERVER_CONFIGURATION_AAM_RULES_FIELD,
                      FBSDK_SERVER_CONFIGURATION_SUGGESTED_EVENTS_SETTING_FIELD
                    #if !TARGET_OS_TV
                      , FBSDK_SERVER_CONFIGURATION_EVENT_BINDINGS_FIELD
                    #endif
                    #ifdef DEBUG
                      , FBSDK_SERVER_CONFIGURATION_UPDATE_MESSAGE_FIELD
                    #endif
                    #if TARGET_OS_TV
                      , FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_OPTIONS_FIELD,
                      FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_BOOKMARK_ICON_URL_FIELD,
                      FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_MENU_ICON_URL_FIELD
                    #endif
  ];
  NSDictionary<NSString *, NSString *> *parameters = @{ @"fields" : [fields componentsJoinedByString:@","],
                                                        @"os_version" : osVersion};

  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:appID
                                                                 parameters:parameters
                                                                tokenString:nil
                                                                 HTTPMethod:nil
                                                                      flags:FBSDKGraphRequestFlagSkipClientToken | FBSDKGraphRequestFlagDisableErrorRecovery];
  return request;
}

#pragma mark - Helper Class Methods

+ (void)_didProcessConfigurationFromNetwork:(FBSDKServerConfiguration *)serverConfiguration
                                      appID:(NSString *)appID
                                      error:(NSError *)error
{
  NSMutableArray *completionBlocks = [[NSMutableArray alloc] init];
  @synchronized(self) {
    if (error) {
      // Only set the error if we don't have previously fetched app settings.
      // (i.e., if we have app settings and a new call gets an error, we'll
      // ignore the error and surface the last successfully fetched settings).
      if (_serverConfiguration && [_serverConfiguration.appID isEqualToString:appID]) {
        // We have older app settings but the refresh received an error.
        // Log and ignore the error.
        [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational
                           formatString:@"loadServerConfigurationWithCompletionBlock failed with %@", error];
      } else {
        _serverConfiguration = nil;
      }
      _serverConfigurationError = error;
      _serverConfigurationErrorTimestamp = [NSDate date];
    } else {
      _serverConfiguration = serverConfiguration;
      _serverConfigurationError = nil;
      _serverConfigurationErrorTimestamp = nil;

    #ifdef DEBUG
      NSString *updateMessage = _serverConfiguration.updateMessage;
      if (updateMessage && updateMessage.length > 0 && !_printedUpdateMessage) {
        _printedUpdateMessage = YES;
        [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational logEntry:updateMessage];
      }
    #endif
    }

    // update the cached copy in NSUserDefaults
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *defaultsKey = [NSString stringWithFormat:FBSDK_SERVER_CONFIGURATION_USER_DEFAULTS_KEY, appID];
    if (serverConfiguration) {
      #pragma clang diagnostic push
      #pragma clang diagnostic ignored "-Wdeprecated-declarations"
      NSData *data = [NSKeyedArchiver archivedDataWithRootObject:serverConfiguration];
      #pragma clang diagnostic pop
      [defaults setObject:data forKey:defaultsKey];
    }

    // wrap the completion blocks
    for (FBSDKServerConfigurationBlock completionBlock in _completionBlocks) {
      [FBSDKTypeUtility array:completionBlocks addObject:[self _wrapperBlockForLoadBlock:completionBlock]];
    }
    [_completionBlocks removeAllObjects];
    _loadingServerConfiguration = NO;
  }

  // release the lock before calling out of this class
  for (void (^completionBlock)(void) in completionBlocks) {
    completionBlock();
  }
}

+ (NSDictionary *)_parseDialogConfigurations:(NSDictionary *)dictionary
{
  NSMutableDictionary *dialogConfigurations = [[NSMutableDictionary alloc] init];
  NSArray *dialogConfigurationsArray = [FBSDKTypeUtility arrayValue:dictionary[@"data"]];
  for (id dialogConfiguration in dialogConfigurationsArray) {
    NSDictionary *dialogConfigurationDictionary = [FBSDKTypeUtility dictionaryValue:dialogConfiguration];
    if (dialogConfigurationDictionary) {
      NSString *name = [FBSDKTypeUtility stringValue:dialogConfigurationDictionary[@"name"]];
      if (name.length) {
        NSURL *URL = [FBSDKTypeUtility URLValue:dialogConfigurationDictionary[@"url"]];
        NSArray *appVersions = [FBSDKTypeUtility arrayValue:dialogConfigurationDictionary[@"versions"]];
        [FBSDKTypeUtility dictionary:dialogConfigurations setObject:[[FBSDKDialogConfiguration alloc] initWithName:name
                                                                                                               URL:URL
                                                                                                       appVersions:appVersions] forKey:name];
      }
    }
  }
  return dialogConfigurations;
}

+ (BOOL)_serverConfigurationTimestampIsValid:(NSDate *)timestamp
{
  return ([[NSDate date] timeIntervalSinceDate:timestamp] < FBSDK_SERVER_CONFIGURATION_MANAGER_CACHE_TIMEOUT);
}

+ (FBSDKCodeBlock)_wrapperBlockForLoadBlock:(FBSDKServerConfigurationBlock)loadBlock
{
  if (!loadBlock) {
    return nil;
  }

  // create local vars to capture the current values from the ivars to allow this wrapper to be called outside of a lock
  FBSDKServerConfiguration *serverConfiguration;
  NSError *serverConfigurationError;
  @synchronized(self) {
    serverConfiguration = _serverConfiguration;
    serverConfigurationError = _serverConfigurationError;
  }
  return ^{
    loadBlock(serverConfiguration, serverConfigurationError);
  };
}

#pragma mark - Object Lifecycle

- (instancetype)init
{
  return nil;
}

@end
