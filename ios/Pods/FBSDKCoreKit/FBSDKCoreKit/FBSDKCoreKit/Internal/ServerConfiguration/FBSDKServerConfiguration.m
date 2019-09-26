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

#import "FBSDKServerConfiguration.h"
#import "FBSDKServerConfiguration+Internal.h"

#import "FBSDKInternalUtility.h"

#define FBSDK_SERVER_CONFIGURATION_ADVERTISING_ID_ENABLED_KEY @"advertisingIDEnabled"
#define FBSDK_SERVER_CONFIGURATION_APP_ID_KEY @"appID"
#define FBSDK_SERVER_CONFIGURATION_APP_NAME_KEY @"appName"
#define FBSDK_SERVER_CONFIGURATION_DIALOG_CONFIGS_KEY @"dialogConfigs"
#define FBSDK_SERVER_CONFIGURATION_DIALOG_FLOWS_KEY @"dialogFlows"
#define FBSDK_SERVER_CONFIGURATION_ERROR_CONFIGS_KEY @"errorConfigs"
#define FBSDK_SERVER_CONFIGURATION_IMPLICIT_LOGGING_ENABLED_KEY @"implicitLoggingEnabled"
#define FBSDK_SERVER_CONFIGURATION_DEFAULT_SHARE_MODE_KEY @"defaultShareMode"
#define FBSDK_SERVER_CONFIGURATION_IMPLICIT_PURCHASE_LOGGING_ENABLED_KEY @"implicitPurchaseLoggingEnabled"
#define FBSDK_SERVER_CONFIGURATION_CODELESS_EVENTS_ENABLED_KEY @"codelessEventsEnabled"
#define FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_ENABLED_KEY @"loginTooltipEnabled"
#define FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_TEXT_KEY @"loginTooltipText"
#define FBSDK_SERVER_CONFIGURATION_SYSTEM_AUTHENTICATION_ENABLED_KEY @"systemAuthenticationEnabled"
#define FBSDK_SERVER_CONFIGURATION_NATIVE_AUTH_FLOW_ENABLED_KEY @"nativeAuthFlowEnabled"
#define FBSDK_SERVER_CONFIGURATION_TIMESTAMP_KEY @"timestamp"
#define FBSDK_SERVER_CONFIGURATION_SESSION_TIMEOUT_INTERVAL @"sessionTimeoutInterval"
#define FBSDK_SERVER_CONFIGURATION_LOGGING_TOKEN @"loggingToken"
#define FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_OPTIONS_KEY @"smartLoginEnabled"
#define FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_BOOKMARK_ICON_URL_KEY @"smarstLoginBookmarkIconURL"
#define FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_MENU_ICON_URL_KEY @"smarstLoginBookmarkMenuURL"
#define FBSDK_SERVER_CONFIGURATION_UPDATE_MESSAGE_KEY @"SDKUpdateMessage"
#define FBSDK_SERVER_CONFIGURATION_EVENT_BINDINGS  @"eventBindings"
#define FBSDK_SERVER_CONFIGURATION_RESTRICTIVE_PARAMS @"restrictiveParams"
#define FBSDK_SERVER_CONFIGURATION_VERSION_KEY @"version"
#define FBSDK_SERVER_CONFIGURATION_TRACK_UNINSTALL_ENABLED_KEY @"trackAppUninstallEnabled"

#pragma mark - Dialog Names

NSString *const FBSDKDialogConfigurationNameDefault = @"default";

NSString *const FBSDKDialogConfigurationNameLogin = @"login";

NSString *const FBSDKDialogConfigurationNameSharing = @"sharing";

NSString *const FBSDKDialogConfigurationNameAppInvite = @"app_invite";
NSString *const FBSDKDialogConfigurationNameGameRequest = @"game_request";
NSString *const FBSDKDialogConfigurationNameGroup = @"group";
NSString *const FBSDKDialogConfigurationNameLike = @"like";
NSString *const FBSDKDialogConfigurationNameMessage = @"message";
NSString *const FBSDKDialogConfigurationNameShare = @"share";

NSString *const FBSDKDialogConfigurationFeatureUseNativeFlow = @"use_native_flow";
NSString *const FBSDKDialogConfigurationFeatureUseSafariViewController = @"use_safari_vc";

// Increase this value when adding new fields and previous cached configurations should be
// treated as stale.
const NSInteger FBSDKServerConfigurationVersion = 2;

@implementation FBSDKServerConfiguration
{
  NSDictionary *_dialogConfigurations;
  NSDictionary *_dialogFlows;
  NSInteger _version;
}

#pragma mark - Object Lifecycle

- (instancetype)initWithAppID:(NSString *)appID
                      appName:(NSString *)appName
          loginTooltipEnabled:(BOOL)loginTooltipEnabled
             loginTooltipText:(NSString *)loginTooltipText
             defaultShareMode:(NSString*)defaultShareMode
         advertisingIDEnabled:(BOOL)advertisingIDEnabled
       implicitLoggingEnabled:(BOOL)implicitLoggingEnabled
implicitPurchaseLoggingEnabled:(BOOL)implicitPurchaseLoggingEnabled
        codelessEventsEnabled:(BOOL)codelessEventsEnabled
  systemAuthenticationEnabled:(BOOL)systemAuthenticationEnabled
        nativeAuthFlowEnabled:(BOOL)nativeAuthFlowEnabled
     uninstallTrackingEnabled:(BOOL)uninstallTrackingEnabled
         dialogConfigurations:(NSDictionary *)dialogConfigurations
                  dialogFlows:(NSDictionary *)dialogFlows
                    timestamp:(NSDate *)timestamp
           errorConfiguration:(FBSDKErrorConfiguration *)errorConfiguration
       sessionTimeoutInterval:(NSTimeInterval) sessionTimeoutInterval
                     defaults:(BOOL)defaults
                 loggingToken:(NSString *)loggingToken
            smartLoginOptions:(FBSDKServerConfigurationSmartLoginOptions)smartLoginOptions
    smartLoginBookmarkIconURL:(NSURL *)smartLoginBookmarkIconURL
        smartLoginMenuIconURL:(NSURL *)smartLoginMenuIconURL
                updateMessage:(NSString *)updateMessage
                eventBindings:(NSArray *)eventBindings
            restrictiveParams:(NSDictionary<NSString *, id> *)restrictiveParams
{
  if ((self = [super init])) {
    _appID = [appID copy];
    _appName = [appName copy];
    _loginTooltipEnabled = loginTooltipEnabled;
    _loginTooltipText = [loginTooltipText copy];
    _defaultShareMode = defaultShareMode;
    _advertisingIDEnabled = advertisingIDEnabled;
    _implicitLoggingEnabled = implicitLoggingEnabled;
    _implicitPurchaseLoggingEnabled = implicitPurchaseLoggingEnabled;
    _codelessEventsEnabled = codelessEventsEnabled;
    _systemAuthenticationEnabled = systemAuthenticationEnabled;
    _uninstallTrackingEnabled = uninstallTrackingEnabled;
    _nativeAuthFlowEnabled = nativeAuthFlowEnabled;
    _dialogConfigurations = [dialogConfigurations copy];
    _dialogFlows = [dialogFlows copy];
    _timestamp = [timestamp copy];
    _errorConfiguration = [errorConfiguration copy];
    _sessionTimoutInterval = sessionTimeoutInterval;
    _defaults = defaults;
    _loggingToken = loggingToken;
    _smartLoginOptions = smartLoginOptions;
    _smartLoginMenuIconURL = [smartLoginMenuIconURL copy];
    _smartLoginBookmarkIconURL = [smartLoginBookmarkIconURL copy];
    _updateMessage = [updateMessage copy];
    _eventBindings = eventBindings;
    _restrictiveParams = restrictiveParams;
    _version = FBSDKServerConfigurationVersion;
  }
  return self;
}

#pragma mark - Public Methods

- (FBSDKDialogConfiguration *)dialogConfigurationForDialogName:(NSString *)dialogName
{
  return _dialogConfigurations[dialogName];
}

- (BOOL)useNativeDialogForDialogName:(NSString *)dialogName
{
  return [self _useFeatureWithKey:FBSDKDialogConfigurationFeatureUseNativeFlow dialogName:dialogName];
}

- (BOOL)useSafariViewControllerForDialogName:(NSString *)dialogName
{
  return [self _useFeatureWithKey:FBSDKDialogConfigurationFeatureUseSafariViewController dialogName:dialogName];
}

#pragma mark - Helper Methods

- (BOOL)_useFeatureWithKey:(NSString *)key dialogName:(NSString *)dialogName
{
  if ([dialogName isEqualToString:FBSDKDialogConfigurationNameLogin]) {
    return ((NSNumber *)(_dialogFlows[dialogName][key] ?:
                         _dialogFlows[FBSDKDialogConfigurationNameDefault][key])).boolValue;
  } else {
    return ((NSNumber *)(_dialogFlows[dialogName][key] ?:
                         _dialogFlows[FBSDKDialogConfigurationNameSharing][key] ?:
                         _dialogFlows[FBSDKDialogConfigurationNameDefault][key])).boolValue;
  }
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  NSString *appID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SERVER_CONFIGURATION_APP_ID_KEY];
  NSString *appName = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SERVER_CONFIGURATION_APP_NAME_KEY];
  BOOL loginTooltipEnabled = [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_ENABLED_KEY];
  NSString *loginTooltipText = [decoder decodeObjectOfClass:[NSString class]
                                                     forKey:FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_TEXT_KEY];
  NSString *defaultShareMode = [decoder decodeObjectOfClass:[NSString class]
                                                     forKey:FBSDK_SERVER_CONFIGURATION_DEFAULT_SHARE_MODE_KEY];
  BOOL advertisingIDEnabled = [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_ADVERTISING_ID_ENABLED_KEY];
  BOOL implicitLoggingEnabled = [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_IMPLICIT_LOGGING_ENABLED_KEY];
  BOOL implicitPurchaseLoggingEnabled =
  [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_IMPLICIT_PURCHASE_LOGGING_ENABLED_KEY];
  BOOL codelessEventsEnabled =
  [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_CODELESS_EVENTS_ENABLED_KEY];
  BOOL systemAuthenticationEnabled =
  [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_SYSTEM_AUTHENTICATION_ENABLED_KEY];
  BOOL uninstallTrackingEnabled =
  [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_TRACK_UNINSTALL_ENABLED_KEY];
  FBSDKServerConfigurationSmartLoginOptions smartLoginOptions = [decoder decodeIntegerForKey:FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_OPTIONS_KEY];
  BOOL nativeAuthFlowEnabled = [decoder decodeBoolForKey:FBSDK_SERVER_CONFIGURATION_NATIVE_AUTH_FLOW_ENABLED_KEY];
  NSDate *timestamp = [decoder decodeObjectOfClass:[NSDate class] forKey:FBSDK_SERVER_CONFIGURATION_TIMESTAMP_KEY];
  NSSet *dialogConfigurationsClasses = [[NSSet alloc] initWithObjects:
                                        [NSDictionary class],
                                        [FBSDKDialogConfiguration class],
                                        nil];
  NSDictionary *dialogConfigurations = [decoder decodeObjectOfClasses:dialogConfigurationsClasses
                                                               forKey:FBSDK_SERVER_CONFIGURATION_DIALOG_CONFIGS_KEY];
  NSSet *dialogFlowsClasses = [[NSSet alloc] initWithObjects:
                               [NSDictionary class],
                               [NSString class],
                               [NSNumber class],
                               nil];
  NSDictionary *dialogFlows = [decoder decodeObjectOfClasses:dialogFlowsClasses
                                                      forKey:FBSDK_SERVER_CONFIGURATION_DIALOG_FLOWS_KEY];
  FBSDKErrorConfiguration *errorConfiguration = [decoder decodeObjectOfClass:[FBSDKErrorConfiguration class] forKey:FBSDK_SERVER_CONFIGURATION_ERROR_CONFIGS_KEY];
  NSTimeInterval sessionTimeoutInterval = [decoder decodeDoubleForKey:FBSDK_SERVER_CONFIGURATION_SESSION_TIMEOUT_INTERVAL];
  NSString *loggingToken = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SERVER_CONFIGURATION_LOGGING_TOKEN];
  NSURL *smartLoginBookmarkIconURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_BOOKMARK_ICON_URL_KEY];
  NSURL *smartLoginMenuIconURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_MENU_ICON_URL_KEY];
  NSString *updateMessage = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SERVER_CONFIGURATION_UPDATE_MESSAGE_KEY];
  NSArray *eventBindings = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_SERVER_CONFIGURATION_EVENT_BINDINGS];
  NSDictionary<NSString *, id> *restrictiveParams = [decoder decodeObjectOfClass:[NSDictionary class] forKey:FBSDK_SERVER_CONFIGURATION_RESTRICTIVE_PARAMS];
  NSInteger version = [decoder decodeIntegerForKey:FBSDK_SERVER_CONFIGURATION_VERSION_KEY];
  FBSDKServerConfiguration *configuration = [self initWithAppID:appID
                                                        appName:appName
                                            loginTooltipEnabled:loginTooltipEnabled
                                               loginTooltipText:loginTooltipText
                                               defaultShareMode:defaultShareMode
                                           advertisingIDEnabled:advertisingIDEnabled
                                         implicitLoggingEnabled:implicitLoggingEnabled
                                 implicitPurchaseLoggingEnabled:implicitPurchaseLoggingEnabled
                                          codelessEventsEnabled:codelessEventsEnabled
                                    systemAuthenticationEnabled:systemAuthenticationEnabled
                                          nativeAuthFlowEnabled:nativeAuthFlowEnabled
                                       uninstallTrackingEnabled:uninstallTrackingEnabled
                                           dialogConfigurations:dialogConfigurations
                                                    dialogFlows:dialogFlows
                                                      timestamp:timestamp
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
                                             ];
  configuration->_version = version;
  return configuration;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeBool:_advertisingIDEnabled forKey:FBSDK_SERVER_CONFIGURATION_ADVERTISING_ID_ENABLED_KEY];
  [encoder encodeObject:_appID forKey:FBSDK_SERVER_CONFIGURATION_APP_ID_KEY];
  [encoder encodeObject:_appName forKey:FBSDK_SERVER_CONFIGURATION_APP_NAME_KEY];
  [encoder encodeObject:_defaultShareMode forKey:FBSDK_SERVER_CONFIGURATION_DEFAULT_SHARE_MODE_KEY];
  [encoder encodeObject:_dialogConfigurations forKey:FBSDK_SERVER_CONFIGURATION_DIALOG_CONFIGS_KEY];
  [encoder encodeObject:_dialogFlows forKey:FBSDK_SERVER_CONFIGURATION_DIALOG_FLOWS_KEY];
  [encoder encodeObject:_errorConfiguration forKey:FBSDK_SERVER_CONFIGURATION_ERROR_CONFIGS_KEY];
  [encoder encodeBool:_implicitLoggingEnabled forKey:FBSDK_SERVER_CONFIGURATION_IMPLICIT_LOGGING_ENABLED_KEY];
  [encoder encodeBool:_implicitPurchaseLoggingEnabled
               forKey:FBSDK_SERVER_CONFIGURATION_IMPLICIT_PURCHASE_LOGGING_ENABLED_KEY];
  [encoder encodeBool:_codelessEventsEnabled
               forKey:FBSDK_SERVER_CONFIGURATION_CODELESS_EVENTS_ENABLED_KEY];
  [encoder encodeBool:_loginTooltipEnabled forKey:FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_ENABLED_KEY];
  [encoder encodeBool:_uninstallTrackingEnabled
               forKey:FBSDK_SERVER_CONFIGURATION_TRACK_UNINSTALL_ENABLED_KEY];
  [encoder encodeObject:_loginTooltipText forKey:FBSDK_SERVER_CONFIGURATION_LOGIN_TOOLTIP_TEXT_KEY];
  [encoder encodeBool:_nativeAuthFlowEnabled forKey:FBSDK_SERVER_CONFIGURATION_NATIVE_AUTH_FLOW_ENABLED_KEY];
  [encoder encodeBool:_systemAuthenticationEnabled forKey:FBSDK_SERVER_CONFIGURATION_SYSTEM_AUTHENTICATION_ENABLED_KEY];
  [encoder encodeObject:_timestamp forKey:FBSDK_SERVER_CONFIGURATION_TIMESTAMP_KEY];
  [encoder encodeDouble:_sessionTimoutInterval forKey:FBSDK_SERVER_CONFIGURATION_SESSION_TIMEOUT_INTERVAL];
  [encoder encodeObject:_loggingToken forKey:FBSDK_SERVER_CONFIGURATION_LOGGING_TOKEN];
  [encoder encodeInteger:_smartLoginOptions forKey:FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_OPTIONS_KEY];
  [encoder encodeObject:_smartLoginBookmarkIconURL forKey:FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_BOOKMARK_ICON_URL_KEY];
  [encoder encodeObject:_smartLoginMenuIconURL forKey:FBSDK_SERVER_CONFIGURATION_SMART_LOGIN_MENU_ICON_URL_KEY];
  [encoder encodeObject:_updateMessage forKey:FBSDK_SERVER_CONFIGURATION_UPDATE_MESSAGE_KEY];
  [encoder encodeObject:_eventBindings forKey:FBSDK_SERVER_CONFIGURATION_EVENT_BINDINGS];
  [encoder encodeObject:_restrictiveParams forKey:FBSDK_SERVER_CONFIGURATION_RESTRICTIVE_PARAMS];
  [encoder encodeInteger:_version forKey:FBSDK_SERVER_CONFIGURATION_VERSION_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  return self;
}

@end
