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

#import <UIKit/UIKit.h>

#import "FBSDKAppEventsUtility.h"
#import "FBSDKGraphRequest+Internal.h"
#import "FBSDKGraphRequest.h"
#import "FBSDKLogger.h"
#import "FBSDKServerConfiguration.h"
#import "FBSDKSettings.h"
#import "FBSDKSwizzler.h"

#define UNINSTALL_TRACKING_DEVICE_ID_KEY          @"device_id"
#define UNINSTALL_TRACKING_PLATFORM_KEY           @"platform"
#define UNINSTALL_TRACKING_DEVICE_TOKEN_KEY       @"device_token"
#define UNINSTALL_TRACKING_TOKEN_ENDPOINT         @"app_push_device_token"

@implementation FBSDKAppEventsUninstall

static BOOL _initiated = NO;
static BOOL _uploaded = NO;
static BOOL _uninstallTrackingEnabled = NO;
static NSString *_token = nil;

+ (void)setUninstallTrackingEnabled:(BOOL)uninstallTrackingEnabled{
  _uninstallTrackingEnabled = uninstallTrackingEnabled;
  // try upload token when enable setting changed
  // will upload if never uploaded before and newly enabled
  [self updateAndUploadToken: _token];
}

+ (BOOL)initiated{
  return _initiated;
}

+ (void)setInitiated{
  _initiated = YES;
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
  void (^registerToken)(id delegate, SEL selector, UIApplication *application, NSData *deviceToken) =
      ^(id delegate, SEL selector, UIApplication *application, NSData *deviceToken)
  {
    NSString *tokenString = [self stringWithDeviceToken:deviceToken];
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational
                           logEntry:[NSString stringWithFormat:@"Register token from Swizzling: %@", tokenString]];
    // try upload token immediately after receiving it from swizzling
    [self updateAndUploadToken: tokenString];
  };

  [FBSDKSwizzler swizzleSelector:@selector(application:didRegisterForRemoteNotificationsWithDeviceToken:)
                         onClass:[[UIApplication sharedApplication].delegate class]
                       withBlock:registerToken named:@"map_control"];
  [self setInitiated];
}

// Token is updated when (changed OR not uploaded)
// Token is uploaded when enabled AND (changed OR not uploaded)
+ (void)updateAndUploadToken:(NSString*) tokenString
{
  if ((tokenString != nil) && ((_token != tokenString) || !_uploaded)){
    // update token
    _token = tokenString;
    if (_uninstallTrackingEnabled){
      // upload token
      FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                    initWithGraphPath:[NSString stringWithFormat:@"%@/%@",
                                                       [FBSDKSettings appID], UNINSTALL_TRACKING_TOKEN_ENDPOINT]
                                    parameters:@{
                                                 UNINSTALL_TRACKING_DEVICE_TOKEN_KEY: _token,
                                                 UNINSTALL_TRACKING_PLATFORM_KEY: @"ios",
                                                 // advertiserID could be 0s if user select limit ad tracking
                                                 UNINSTALL_TRACKING_DEVICE_ID_KEY:  [FBSDKAppEventsUtility advertiserID]?:@""
                                                 }
                                    tokenString:nil
                                    HTTPMethod:@"POST"
                                    flags:FBSDKGraphRequestFlagDisableErrorRecovery |
                                              FBSDKGraphRequestFlagDoNotInvalidateTokenOnError |
                                              FBSDKGraphRequestFlagSkipClientToken
                                    ];
      [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
          if (!error)
          {
            [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorInformational
                                   logEntry:[NSString stringWithFormat:@"Upload token complete: %@", result]];
            _uploaded = YES;
         }
          else
          {
            [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                                   logEntry:[NSString stringWithFormat:
                                             @"Upload token fail with parameter: %@, error: %@", request.parameters, error]];
          }
        }
      ];
    }
  }
}


@end
