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

#import "FBSDKLoginUtility.h"

#import <FBSDKCoreKit/FBSDKConstants.h>
#import <FBSDKCoreKit/FBSDKSettings.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLoginConstants.h"

@implementation FBSDKLoginUtility

+ (NSString *)stringForAudience:(FBSDKDefaultAudience)audience
{
  switch (audience) {
    case FBSDKDefaultAudienceOnlyMe:
      return @"only_me";
    case FBSDKDefaultAudienceFriends:
      return @"friends";
    case FBSDKDefaultAudienceEveryone:
      return @"everyone";
  }
}

+ (NSDictionary *)queryParamsFromLoginURL:(NSURL *)url
{
  NSString *expectedUrlPrefix = [FBSDKInternalUtility
                                 appURLWithHost:@"authorize"
                                 path:@""
                                 queryParameters:@{}
                                 error:NULL].absoluteString;
  if (![url.absoluteString hasPrefix:expectedUrlPrefix]) {
    // Don't have an App ID, just verify path.
    NSString *host = url.host;
    if (![host isEqualToString:@"authorize"]) {
      return nil;
    }
  }
  NSMutableDictionary *params = [NSMutableDictionary dictionaryWithDictionary:[FBSDKInternalUtility dictionaryFromFBURL:url]];

  NSString *userID = [[self class] userIDFromSignedRequest:params[@"signed_request"]];
  if (userID) {
    params[@"user_id"] = userID;
  }

  return params;
}

+ (NSString *)userIDFromSignedRequest:(NSString *)signedRequest
{
  if (!signedRequest) {
    return nil;
  }

  NSArray *signatureAndPayload = [signedRequest componentsSeparatedByString:@"."];
  NSString *userID = nil;

  if (signatureAndPayload.count == 2) {
    NSData *data = [FBSDKBase64 decodeAsData:signatureAndPayload[1]];
    if (data) {
      NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
      userID = dictionary[@"user_id"];
    }
  }
  return userID;
}

@end
