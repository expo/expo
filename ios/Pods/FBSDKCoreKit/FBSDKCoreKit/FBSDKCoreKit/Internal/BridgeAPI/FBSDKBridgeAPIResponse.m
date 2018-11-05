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

#import "FBSDKBridgeAPIResponse.h"

#import "FBSDKBridgeAPICrypto.h"
#import "FBSDKBridgeAPIProtocol.h"
#import "FBSDKBridgeAPIProtocolType.h"
#import "FBSDKBridgeAPIRequest+Private.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKMacros.h"
#import "FBSDKTypeUtility.h"
#import "FBSDKUtility.h"

@interface FBSDKBridgeAPIResponse ()
- (instancetype)initWithRequest:(FBSDKBridgeAPIRequest *)request
             responseParameters:(NSDictionary *)responseParameters
                      cancelled:(BOOL)cancelled
                          error:(NSError *)error
NS_DESIGNATED_INITIALIZER;
@end

@implementation FBSDKBridgeAPIResponse

#pragma mark - Class Methods

+ (instancetype)bridgeAPIResponseWithRequest:(FBSDKBridgeAPIRequest *)request error:(NSError *)error
{
  return [[self alloc] initWithRequest:request
                    responseParameters:nil
                             cancelled:NO
                                 error:error];
}

+ (instancetype)bridgeAPIResponseWithRequest:(FBSDKBridgeAPIRequest *)request
                                 responseURL:(NSURL *)responseURL
                           sourceApplication:(NSString *)sourceApplication
                                       error:(NSError *__autoreleasing *)errorRef
{
  FBSDKBridgeAPIProtocolType protocolType = request.protocolType;
  switch (protocolType) {
    case FBSDKBridgeAPIProtocolTypeNative:{
      if (![FBSDKInternalUtility isFacebookBundleIdentifier:sourceApplication]) {
        [FBSDKBridgeAPICrypto reset];
        return nil;
      }
      break;
    }
    case FBSDKBridgeAPIProtocolTypeWeb:{
      if (![FBSDKInternalUtility isSafariBundleIdentifier:sourceApplication]) {
        [FBSDKBridgeAPICrypto reset];
        return nil;
      }
      break;
    }
  }
  NSDictionary *queryParameters = [FBSDKUtility dictionaryWithQueryString:responseURL.query];
  queryParameters = [FBSDKBridgeAPICrypto decryptResponseForRequest:request
                                                    queryParameters:queryParameters
                                                              error:errorRef];
  if (!queryParameters) {
    return nil;
  }
  id<FBSDKBridgeAPIProtocol> protocol = request.protocol;
  BOOL cancelled;
  NSError *error;
  NSDictionary *responseParameters = [protocol responseParametersForActionID:request.actionID
                                                             queryParameters:queryParameters
                                                                   cancelled:&cancelled
                                                                       error:&error];
  if (errorRef != NULL) {
    *errorRef = error;
  }
  if (!responseParameters) {
    return nil;
  }
  return [[self alloc] initWithRequest:request
                    responseParameters:responseParameters
                             cancelled:cancelled
                                 error:error];
}

+ (instancetype)bridgeAPIResponseCancelledWithRequest:(FBSDKBridgeAPIRequest *)request
{
  return [[self alloc] initWithRequest:request
                    responseParameters:nil
                             cancelled:YES
                                 error:nil];
}

#pragma mark - Object Lifecycle

- (instancetype)initWithRequest:(FBSDKBridgeAPIRequest *)request
             responseParameters:(NSDictionary *)responseParameters
                      cancelled:(BOOL)cancelled
                          error:(NSError *)error
{
  if ((self = [super init])) {
    _request = [request copy];
    _responseParameters = [responseParameters copy];
    _cancelled = cancelled;
    _error = [error copy];
  }
  return self;
}

- (instancetype)init
{
  FBSDK_NOT_DESIGNATED_INITIALIZER(initWithRequest:responseParameters:cancelled:error:);
  return [self initWithRequest:nil responseParameters:nil cancelled:NO error:nil];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  return self;
}

@end
