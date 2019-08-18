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

#import "FBSDKAppLinkUtility.h"

#import <Bolts/BFURL.h>

#import "FBSDKAppEventsUtility.h"
#import "FBSDKGraphRequest.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKSettings.h"
#import "FBSDKUtility.h"

static NSString *const FBSDKLastDeferredAppLink = @"com.facebook.sdk:lastDeferredAppLink%@";
static NSString *const FBSDKDeferredAppLinkEvent = @"DEFERRED_APP_LINK";

@implementation FBSDKAppLinkUtility {}

+ (void)fetchDeferredAppLink:(FBSDKDeferredAppLinkHandler)handler
{
  NSAssert([NSThread isMainThread], @"FBSDKAppLink fetchDeferredAppLink: must be invoked from main thread.");

  NSString *appID = [FBSDKSettings appID];

  // Deferred app links are only currently used for engagement ads, thus we consider the app to be an advertising one.
  // If this is considered for organic, non-ads scenarios, we'll need to retrieve the FBAppEventsUtility.shouldAccessAdvertisingID
  // before we make this call.
  NSMutableDictionary *deferredAppLinkParameters =
  [FBSDKAppEventsUtility activityParametersDictionaryForEvent:FBSDKDeferredAppLinkEvent
                                           implicitEventsOnly:NO
                                    shouldAccessAdvertisingID:YES];

  FBSDKGraphRequest *deferredAppLinkRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@/activities", appID, nil]
                                                                                parameters:deferredAppLinkParameters
                                                                               tokenString:nil
                                                                                   version:nil
                                                                                HTTPMethod:@"POST"];

  [deferredAppLinkRequest startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                                       id result,
                                                       NSError *error) {
    NSURL *applinkURL = nil;
    if (!error) {
      NSString *appLinkString = result[@"applink_url"];
      if (appLinkString) {
        applinkURL = [NSURL URLWithString:appLinkString];

        NSString *createTimeUtc = result[@"click_time"];
        if (createTimeUtc) {
          // append/translate the create_time_utc so it can be used by clients
          NSString *modifiedURLString = [applinkURL.absoluteString
                                         stringByAppendingFormat:@"%@fb_click_time_utc=%@",
                                         (applinkURL.query) ? @"&" : @"?" ,
                                         createTimeUtc];
          applinkURL = [NSURL URLWithString:modifiedURLString];
        }
      }
    }

    if (handler) {
      dispatch_async(dispatch_get_main_queue(), ^{
        handler(applinkURL, error);
      });
    }
  }];
}

+ (BOOL)fetchDeferredAppInvite:(FBSDKDeferredAppInviteHandler)handler
{
  return NO;
}

+ (NSString*)appInvitePromotionCodeFromURL:(NSURL*)url;
{
  BFURL *parsedUrl = [[FBSDKInternalUtility resolveBoltsClassWithName:@"BFURL"] URLWithURL:url];
  NSDictionary *extras = parsedUrl.appLinkExtras;
  if (extras) {
    NSString *deeplinkContextString = extras[@"deeplink_context"];

    // Parse deeplinkContext and extract promo code
    if (deeplinkContextString.length > 0) {
      NSError *error = nil;
      NSDictionary *deeplinkContextData = [FBSDKInternalUtility objectForJSONString:deeplinkContextString error:&error];
      if (!error && [deeplinkContextData isKindOfClass:[NSDictionary class]]) {
        return deeplinkContextData[@"promo_code"];
      }
    }
  }

  return nil;

}
@end
