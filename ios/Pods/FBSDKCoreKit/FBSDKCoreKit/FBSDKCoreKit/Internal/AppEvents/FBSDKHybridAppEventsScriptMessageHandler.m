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

#import "FBSDKHybridAppEventsScriptMessageHandler.h"

#import <FBSDKCoreKit/FBSDKAppEvents.h>

#import "FBSDKAppEvents+Internal.h"

NSString *const FBSDKAppEventsWKWebViewMessagesPixelReferralParamKey = @"_fb_pixel_referral_id";

@class WKUserContentController;

@implementation FBSDKHybridAppEventsScriptMessageHandler

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {

  if ([message.name isEqualToString:FBSDKAppEventsWKWebViewMessagesHandlerKey]) {
    NSString *event = message.body[FBSDKAppEventsWKWebViewMessagesEventKey];
    if (event.length > 0) {
      NSString *stringedParams = message.body[FBSDKAppEventsWKWebViewMessagesParamsKey];
      NSMutableDictionary <NSObject *, NSObject *> *params = nil;
      NSError *jsonParseError = nil;
      if ([stringedParams isKindOfClass:[NSString class]]) {
        params = [NSJSONSerialization JSONObjectWithData:[stringedParams dataUsingEncoding:NSUTF8StringEncoding]
                                                                                    options:NSJSONReadingMutableContainers
                                                                                      error:&jsonParseError
                  ];
      }
      NSString *pixelID = message.body[FBSDKAppEventsWKWebViewMessagesPixelIDKey];
      if (pixelID == nil) {
        [FBSDKAppEventsUtility logAndNotify:@"Can't bridge an event without a referral Pixel ID. Check your webview Pixel configuration."];
        return;
      }
      if (jsonParseError != nil || ![params isKindOfClass:[NSDictionary class]] || params == nil) {
        [FBSDKAppEventsUtility logAndNotify:@"Could not find parameters for your Pixel request. Check your webview Pixel configuration."];
        params = [[NSMutableDictionary alloc] initWithObjectsAndKeys:pixelID, FBSDKAppEventsWKWebViewMessagesPixelReferralParamKey, nil];
      }
      else {
        params[FBSDKAppEventsWKWebViewMessagesPixelReferralParamKey] = pixelID;
      }
      [FBSDKAppEvents logEvent:event parameters:params];
    }
  }
}

@end
