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

#import "FBSDKBridgeAPIRequest.h"
#import "FBSDKBridgeAPIRequest+Private.h"

#import "FBSDKBridgeAPIProtocolNativeV1.h"
#import "FBSDKBridgeAPIProtocolWebV1.h"
#import "FBSDKBridgeAPIProtocolWebV2.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKSettings.h"

NSString *const FBSDKBridgeAPIAppIDKey = @"app_id";
NSString *const FBSDKBridgeAPISchemeSuffixKey = @"scheme_suffix";
NSString *const FBSDKBridgeAPIVersionKey = @"version";

@implementation FBSDKBridgeAPIRequest

#pragma mark - Class Methods

+ (instancetype)bridgeAPIRequestWithProtocolType:(FBSDKBridgeAPIProtocolType)protocolType
                                          scheme:(NSString *)scheme
                                      methodName:(NSString *)methodName
                                   methodVersion:(NSString *)methodVersion
                                      parameters:(NSDictionary *)parameters
                                        userInfo:(NSDictionary *)userInfo
{
  return [[self alloc] initWithProtocol:[self _protocolForType:protocolType scheme:scheme]
                           protocolType:protocolType
                                 scheme:scheme
                             methodName:methodName
                          methodVersion:methodVersion
                             parameters:parameters
                               userInfo:userInfo];
}

+ (NSDictionary *)protocolMap
{
  static NSDictionary *_protocolMap;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _protocolMap = @{
                     @(FBSDKBridgeAPIProtocolTypeNative): @{
                         FBSDK_CANOPENURL_FACEBOOK:[[FBSDKBridgeAPIProtocolNativeV1 alloc] initWithAppScheme:@"fbapi20130214"],
                         FBSDK_CANOPENURL_MESSENGER:[[FBSDKBridgeAPIProtocolNativeV1 alloc] initWithAppScheme:@"fb-messenger-share-api"],
                         FBSDK_CANOPENURL_MSQRD_PLAYER:[[FBSDKBridgeAPIProtocolNativeV1 alloc] initWithAppScheme:@"msqrdplayer-api20170208"]
                         },
                     @(FBSDKBridgeAPIProtocolTypeWeb): @{
                         @"https": [[FBSDKBridgeAPIProtocolWebV1 alloc] init],
                         @"web": [[FBSDKBridgeAPIProtocolWebV2 alloc] init]
                         },
                     };
  });
  return _protocolMap;
}

#pragma mark - Object Lifecycle

- (instancetype)initWithProtocol:(id<FBSDKBridgeAPIProtocol>)protocol
                    protocolType:(FBSDKBridgeAPIProtocolType)protocolType
                          scheme:(NSString *)scheme
                      methodName:(NSString *)methodName
                   methodVersion:(NSString *)methodVersion
                      parameters:(NSDictionary *)parameters
                        userInfo:(NSDictionary *)userInfo
{
  if (!protocol) {
    return nil;
  }
  if ((self = [super init])) {
    _protocol = protocol;
    _protocolType = protocolType;
    _scheme = [scheme copy];
    _methodName = [methodName copy];
    _methodVersion = [methodVersion copy];
    _parameters = [parameters copy];
    _userInfo = [userInfo copy];

    _actionID = [NSUUID UUID].UUIDString;
  }
  return self;
}

#pragma mark - Public Methods

- (NSURL *)requestURL:(NSError *__autoreleasing *)errorRef
{
  NSURL *requestURL = [_protocol requestURLWithActionID:self.actionID
                                                 scheme:self.scheme
                                             methodName:self.methodName
                                          methodVersion:self.methodVersion
                                             parameters:self.parameters
                                                  error:errorRef];
  if (!requestURL) {
    return nil;
  }

  [FBSDKInternalUtility validateURLSchemes];

  NSDictionary<NSString *, NSString *> *requestQueryParameters = [FBSDKBasicUtility dictionaryWithQueryString:requestURL.query];
  NSMutableDictionary *queryParameters = [[NSMutableDictionary alloc] initWithDictionary:requestQueryParameters];
  [FBSDKBasicUtility dictionary:queryParameters setObject:[FBSDKSettings appID] forKey:FBSDKBridgeAPIAppIDKey];
  [FBSDKBasicUtility dictionary:queryParameters
                      setObject:[FBSDKSettings appURLSchemeSuffix]
                         forKey:FBSDKBridgeAPISchemeSuffixKey];
  requestURL = [FBSDKInternalUtility URLWithScheme:requestURL.scheme
                                              host:requestURL.host
                                              path:requestURL.path
                                   queryParameters:queryParameters
                                             error:errorRef];
  return requestURL;
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  return self;
}

+ (id<FBSDKBridgeAPIProtocol>)_protocolForType:(FBSDKBridgeAPIProtocolType)type scheme:(NSString *)scheme
{
  id<FBSDKBridgeAPIProtocol> protocol = [self protocolMap][@(type)][scheme];
  if (type == FBSDKBridgeAPIProtocolTypeWeb) {
    return protocol;
  }
  NSURLComponents *components = [[NSURLComponents alloc] init];
  components.scheme = scheme;
  components.path = @"/";
  if ([[UIApplication sharedApplication] canOpenURL:components.URL]) {
    return protocol;
  }
  return nil;
}

@end
