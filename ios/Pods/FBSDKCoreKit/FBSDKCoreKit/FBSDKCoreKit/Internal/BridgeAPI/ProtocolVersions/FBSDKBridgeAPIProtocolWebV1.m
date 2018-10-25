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

#import "FBSDKBridgeAPIProtocolWebV1.h"

#import <UIKit/UIKit.h>

#import "FBSDKBase64.h"
#import "FBSDKBridgeAPIRequest.h"
#import "FBSDKError.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKMacros.h"
#import "FBSDKSettings.h"
#import "FBSDKTypeUtility.h"

#define FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_ACTION_ID_KEY @"action_id"
#define FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_BRIDGE_ARGS_KEY @"bridge_args"

@implementation FBSDKBridgeAPIProtocolWebV1

#pragma mark - FBSDKBridgeAPIProtocol

- (NSURL *)requestURLWithActionID:(NSString *)actionID
                           scheme:(NSString *)scheme
                       methodName:(NSString *)methodName
                    methodVersion:(NSString *)methodVersion
                       parameters:(NSDictionary *)parameters
                            error:(NSError *__autoreleasing *)errorRef
{
  NSMutableDictionary *queryParameters = [[NSMutableDictionary alloc] initWithDictionary:parameters];
  queryParameters[@"display"] = @"touch";
  NSString *bridgeArgs = [FBSDKInternalUtility JSONStringForObject:@{ FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_ACTION_ID_KEY: actionID }
                                                             error:NULL
                                              invalidObjectHandler:NULL];
  NSDictionary *redirectQueryParameters = @{ FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_BRIDGE_ARGS_KEY: bridgeArgs };
  NSURL *redirectURL = [FBSDKInternalUtility appURLWithHost:@"bridge"
                                                       path:methodName
                                            queryParameters:redirectQueryParameters
                                                      error:NULL];
  [FBSDKInternalUtility dictionary:queryParameters setObject:redirectURL forKey:@"redirect_uri"];
  [queryParameters addEntriesFromDictionary:parameters];
  return [FBSDKInternalUtility facebookURLWithHostPrefix:@"m"
                                                    path:[@"/dialog/" stringByAppendingString:methodName]
                                         queryParameters:queryParameters
                                                   error:NULL];
}

- (NSDictionary *)responseParametersForActionID:(NSString *)actionID
                                queryParameters:(NSDictionary *)queryParameters
                                      cancelled:(BOOL *)cancelledRef
                                          error:(NSError *__autoreleasing *)errorRef
{
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  NSInteger errorCode = [FBSDKTypeUtility integerValue:queryParameters[@"error_code"]];
  switch (errorCode) {
    case 0:{
      // good to go, handle the other codes and bail
      break;
    }
    case 4201:{
      return @{
               @"completionGesture": @"cancel",
               };
      break;
    }
    default:{
      if (errorRef != NULL) {
        *errorRef = [FBSDKError errorWithCode:errorCode
                                      message:[FBSDKTypeUtility stringValue:queryParameters[@"error_message"]]];
      }
      return nil;
      break;
    }
  }

  NSError *error;
  NSString *bridgeParametersJSON = [FBSDKTypeUtility stringValue:queryParameters[FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_BRIDGE_ARGS_KEY]];
  NSDictionary *bridgeParameters = [FBSDKInternalUtility objectForJSONString:bridgeParametersJSON error:&error];
  if (!bridgeParameters) {
    if (error && (errorRef != NULL)) {
      *errorRef = [FBSDKError invalidArgumentErrorWithName:FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_BRIDGE_ARGS_KEY
                                                     value:bridgeParametersJSON
                                                   message:nil
                                           underlyingError:error];
    }
    return nil;
  }
  NSString *responseActionID = bridgeParameters[FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_ACTION_ID_KEY];
  responseActionID = [FBSDKTypeUtility stringValue:responseActionID];
  if (![responseActionID isEqualToString:actionID]) {
    return nil;
  }
  NSMutableDictionary *resultParameters = [queryParameters mutableCopy];
  [resultParameters removeObjectForKey:FBSDK_BRIDGE_API_PROTOCOL_WEB_V1_BRIDGE_ARGS_KEY];
  resultParameters[@"didComplete"] = @YES;
  return resultParameters;
}

@end
