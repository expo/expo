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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

#import "FBSDKAuthenticationStatusUtility.h"

#ifdef FBSDKCOCOAPODS
 #import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>
#else
 #import "FBSDKCoreKit+Internal.h"
#endif

#import "FBSDKAuthenticationToken+Internal.h"

static NSString *const FBSDKOIDCStatusPath = @"/platform/oidc/status";

@implementation FBSDKAuthenticationStatusUtility

+ (void)checkAuthenticationStatus
{
  NSURL *requestURL = [self _requestURL];
  if (!requestURL) {
    return;
  }

  NSURLRequest *request = [NSURLRequest requestWithURL:requestURL];
  if (request) {
    [[NSURLSession.sharedSession dataTaskWithRequest:request
                                   completionHandler:^(NSData *_Nullable data, NSURLResponse *_Nullable response, NSError *_Nullable error) {
                                     if (!error) {
                                       fb_dispatch_on_main_thread(^{
                                         [self _handleResponse:response];
                                       });
                                     } else {
                                       [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorNetworkRequests
                                                          formatString:@"%@", [error localizedDescription]];
                                     }
                                   }] resume];
  }
}

+ (void)_handleResponse:(NSURLResponse *)response
{
  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;

  if (httpResponse.statusCode != 200) {
    return;
  }

  if ([httpResponse respondsToSelector:@selector(allHeaderFields)]) {
    NSDictionary *header = [httpResponse allHeaderFields];
    NSString *status = [FBSDKTypeUtility dictionary:header objectForKey:@"fb-s" ofType:NSString.class];
    if ([status isEqualToString:@"not_authorized"]) {
      [self _invalidateCurrentSession];
    }
  }
}

+ (NSURL *)_requestURL
{
  FBSDKAuthenticationToken *token = FBSDKAuthenticationToken.currentAuthenticationToken;

  if (!token.tokenString) {
    return nil;
  }

  NSDictionary *params = @{@"id_token" : token.tokenString};
  NSError *error;

  NSURL *requestURL = [FBSDKInternalUtility unversionedFacebookURLWithHostPrefix:@"m"
                                                                            path:FBSDKOIDCStatusPath
                                                                 queryParameters:params
                                                                           error:&error];
  return error == nil ? requestURL : nil;
}

+ (void)_invalidateCurrentSession
{
  FBSDKAccessToken.currentAccessToken = nil;
  FBSDKAuthenticationToken.currentAuthenticationToken = nil;
  FBSDKProfile.currentProfile = nil;
}

@end

#endif
