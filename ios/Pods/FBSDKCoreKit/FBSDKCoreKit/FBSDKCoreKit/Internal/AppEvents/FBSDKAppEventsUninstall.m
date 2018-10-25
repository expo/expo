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

#import "FBSDKAppEventsUninstall.h"

#import <objc/runtime.h>

#import <UIKit/UIKit.h>
#import <UserNotifications/UserNotifications.h>

#import "FBSDKAppEventsUtility.h"
#import "FBSDKGraphRequest.h"
#import "FBSDKLogger.h"
#import "FBSDKServerConfigurationManager.h"
#import "FBSDKSettings.h"
#import "FBSDKSwizzler.h"

#define UNINSTALL_TRACKING_DEVICE_ID_KEY          @"device_id"
#define UNINSTALL_TRACKING_PLATFORM_KEY           @"platform"
#define UNINSTALL_TRACKING_DEVICE_TOKEN_KEY       @"device_token"
#define UNINSTALL_TRACKING_TOKEN_ENDPOINT         @"app_push_device_token"

@implementation FBSDKAppEventsUninstall

+ (void)load
{
  [FBSDKAppEventsUninstall installSwizzler];
}

+ (NSString *)stringWithDeviceToken:(NSData *)deviceToken {
  const char *data = [deviceToken bytes];
  NSMutableString *token = [NSMutableString string];

  for (NSUInteger i = 0; i < [deviceToken length]; i++) {
    [token appendFormat:@"%02.2hhX", data[i]];
  }

  return [token copy];
}

+ (void)installSwizzler
{
  Class cls = [[UIApplication sharedApplication].delegate class];
  SEL selector = @selector(application:didRegisterForRemoteNotificationsWithDeviceToken:);
  BOOL hasMethod = class_getInstanceMethod(cls, selector) != nil;
  void (^block)(id) = ^(NSData *deviceToken) {
    NSString *tokenString = [self stringWithDeviceToken:deviceToken];
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational
                           logEntry:[NSString stringWithFormat:@"Register token from Swizzling: %@", tokenString]];
    // try upload token immediately after receiving it from swizzling
    [self updateAndUploadToken:tokenString];
  };

  if (!hasMethod)
  {
    void (^registerBlock)(id, id, id) = ^(id _, id __, NSData *deviceToken)
    {
      block(deviceToken);
    };
    IMP imp = imp_implementationWithBlock(registerBlock);
    struct objc_method_description desc = protocol_getMethodDescription(@protocol(UIApplicationDelegate),
                                                                         selector, NO, YES);
    const char *types = desc.types;
    class_addMethod(cls, selector, imp, types);
  } else
  {
    void (^registerBlock)(id, SEL, id, id) = ^(id _, SEL __, id ___, NSData *deviceToken)
    {
      block(deviceToken);
    };
    [FBSDKSwizzler swizzleSelector:selector
                           onClass:cls
                         withBlock:registerBlock
                             named:@"map_control"];
  }
}

// Token is updated when (changed OR not uploaded)
// Token is uploaded when enabled AND (changed OR not uploaded)
+ (void)updateAndUploadToken:(NSString *)tokenString
{
  if (!tokenString) {
    return;
  }

  [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:^(FBSDKServerConfiguration *serverConfiguration, NSError *error) {
    if (serverConfiguration.uninstallTrackingEnabled) {
      FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                    initWithGraphPath:[NSString stringWithFormat:@"%@/%@",
                                                       [FBSDKSettings appID], UNINSTALL_TRACKING_TOKEN_ENDPOINT]
                                    parameters:@{
                                                 UNINSTALL_TRACKING_DEVICE_TOKEN_KEY: tokenString,
                                                 UNINSTALL_TRACKING_PLATFORM_KEY: @"ios",
                                                 // advertiserID could be 0s if user select limit ad tracking
                                                 UNINSTALL_TRACKING_DEVICE_ID_KEY:  [FBSDKAppEventsUtility advertiserID]?:@""
                                                 }
                                    HTTPMethod:@"POST"];
      [request startWithCompletionHandler:nil];
    }
  }];
}

@end
