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

#import <Foundation/Foundation.h>

#import <FBSDKCoreKit/FBSDKCopying.h>

#import "FBSDKDialogConfiguration.h"
#import "FBSDKErrorConfiguration.h"

// login kit
FOUNDATION_EXPORT NSString *const FBSDKDialogConfigurationNameLogin;

// share kit
FOUNDATION_EXPORT NSString *const FBSDKDialogConfigurationNameAppInvite;
FOUNDATION_EXPORT NSString *const FBSDKDialogConfigurationNameGameRequest;
FOUNDATION_EXPORT NSString *const FBSDKDialogConfigurationNameGroup;
FOUNDATION_EXPORT NSString *const FBSDKDialogConfigurationNameLike;
FOUNDATION_EXPORT NSString *const FBSDKDialogConfigurationNameMessage;
FOUNDATION_EXPORT NSString *const FBSDKDialogConfigurationNameShare;

FOUNDATION_EXPORT const NSInteger FBSDKServerConfigurationVersion;

typedef NS_OPTIONS(NSUInteger, FBSDKServerConfigurationSmartLoginOptions)
{
  FBSDKServerConfigurationSmartLoginOptionsUnknown = 0,
  FBSDKServerConfigurationSmartLoginOptionsEnabled = 1 << 0,
  FBSDKServerConfigurationSmartLoginOptionsRequireConfirmation  = 1 << 1,
};

NS_SWIFT_NAME(ServerConfiguration)
@interface FBSDKServerConfiguration : NSObject <FBSDKCopying, NSSecureCoding>

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

- (instancetype)initWithAppID:(NSString *)appID
                      appName:(NSString *)appName
          loginTooltipEnabled:(BOOL)loginTooltipEnabled
             loginTooltipText:(NSString *)loginTooltipText
             defaultShareMode:(NSString *)defaultShareMode
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
                     AAMRules:(NSDictionary<NSString *, id> *)AAMRules
NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign, readonly, getter=isAdvertisingIDEnabled) BOOL advertisingIDEnabled;
@property (nonatomic, copy, readonly) NSString *appID;
@property (nonatomic, copy, readonly) NSString *appName;
@property (nonatomic, assign, readonly, getter=isDefaults) BOOL defaults;
@property (nonatomic, copy, readonly) NSString *defaultShareMode;
@property (nonatomic, strong, readonly) FBSDKErrorConfiguration *errorConfiguration;
@property (nonatomic, assign, readonly, getter=isImplicitLoggingSupported) BOOL implicitLoggingEnabled;
@property (nonatomic, assign, readonly, getter=isImplicitPurchaseLoggingSupported) BOOL implicitPurchaseLoggingEnabled;
@property (nonatomic, assign, readonly, getter=isCodelessEventsEnabled) BOOL codelessEventsEnabled;
@property (nonatomic, assign, readonly, getter=isLoginTooltipEnabled) BOOL loginTooltipEnabled;
@property (nonatomic, assign, readonly, getter=isNativeAuthFlowEnabled) BOOL nativeAuthFlowEnabled;
@property (nonatomic, assign, readonly, getter=isSystemAuthenticationEnabled) BOOL systemAuthenticationEnabled;
@property (nonatomic, assign, readonly, getter=isUninstallTrackingEnabled) BOOL uninstallTrackingEnabled;
@property (nonatomic, copy, readonly) NSString *loginTooltipText;
@property (nonatomic, copy, readonly) NSDate *timestamp;
@property (nonatomic, assign) NSTimeInterval sessionTimoutInterval;
@property (nonatomic, copy, readonly) NSString *loggingToken;
@property (nonatomic, assign, readonly) FBSDKServerConfigurationSmartLoginOptions smartLoginOptions;
@property (nonatomic, copy, readonly) NSURL *smartLoginBookmarkIconURL;
@property (nonatomic, copy, readonly) NSURL *smartLoginMenuIconURL;
@property (nonatomic, copy, readonly) NSString *updateMessage;
@property (nonatomic, copy, readonly) NSArray *eventBindings;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *restrictiveParams;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id> *AAMRules;
@property (nonatomic, readonly) NSInteger version;

- (FBSDKDialogConfiguration *)dialogConfigurationForDialogName:(NSString *)dialogName;
- (BOOL)useNativeDialogForDialogName:(NSString *)dialogName;
- (BOOL)useSafariViewControllerForDialogName:(NSString *)dialogName;

@end
