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

#import "FBSDKGraphRequest+Internal.h"

#import <UIKit/UIKit.h>

#import "FBSDKAccessToken.h"
#import "FBSDKCoreKit.h"
#import "FBSDKGraphRequestConnection.h"
#import "FBSDKGraphRequestDataAttachment.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings+Internal.h"

// constants
static NSString *const kGetHTTPMethod = @"GET";
static NSString *const kPostHTTPMethod = @"POST";

@interface FBSDKGraphRequest()
@property (nonatomic, assign) FBSDKGraphRequestFlags flags;
@end

@implementation FBSDKGraphRequest

- (instancetype)init NS_UNAVAILABLE
{
  assert(0);
}

- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters {
  return [self initWithGraphPath:graphPath
                      parameters:parameters
                           flags:FBSDKGraphRequestFlagNone];
}

- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                       HTTPMethod:(NSString *)HTTPMethod {
  return [self initWithGraphPath:graphPath
                      parameters:parameters
                     tokenString:[FBSDKAccessToken currentAccessToken].tokenString
                         version:nil
                      HTTPMethod:HTTPMethod];
}

- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                            flags:(FBSDKGraphRequestFlags)flags {
  return [self initWithGraphPath:graphPath
                      parameters:parameters
                     tokenString:[FBSDKAccessToken currentAccessToken].tokenString
                      HTTPMethod:nil
                           flags:flags];
}

- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                      tokenString:(NSString *)tokenString
                       HTTPMethod:(NSString *)HTTPMethod
                            flags:(FBSDKGraphRequestFlags)flags {
  if ((self = [self initWithGraphPath:graphPath
                           parameters:parameters
                          tokenString:tokenString
                              version:[FBSDKSettings graphAPIVersion]
                           HTTPMethod:HTTPMethod])) {
    self.flags |= flags;
  }
  return self;
}

- (instancetype)initWithGraphPath:(NSString *)graphPath
                       parameters:(NSDictionary *)parameters
                      tokenString:(NSString *)tokenString
                          version:(NSString *)version
                       HTTPMethod:(NSString *)HTTPMethod {
  if ((self = [super init])) {
    _tokenString = [tokenString copy];
    _version = version ? [version copy] : [FBSDKSettings graphAPIVersion];
    _graphPath = [graphPath copy];
    _HTTPMethod = HTTPMethod ? [HTTPMethod copy] : kGetHTTPMethod;
    _parameters = [[NSMutableDictionary alloc] initWithDictionary:parameters];
    if ([FBSDKSettings isGraphErrorRecoveryDisabled]) {
      _flags = FBSDKGraphRequestFlagDisableErrorRecovery;
    }
  }
  return self;
}

- (BOOL)isGraphErrorRecoveryDisabled
{
  return (self.flags & FBSDKGraphRequestFlagDisableErrorRecovery);
}

- (void)setGraphErrorRecoveryDisabled:(BOOL)disable
{
  if (disable) {
    self.flags |= FBSDKGraphRequestFlagDisableErrorRecovery;
  } else {
    self.flags &= ~FBSDKGraphRequestFlagDisableErrorRecovery;
  }
}

- (BOOL)hasAttachments
{
  __block BOOL hasAttachments = NO;
  [self.parameters enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    if ([FBSDKGraphRequest isAttachment:obj]) {
      hasAttachments = YES;
      *stop = YES;
    }
  }];
  return hasAttachments;
}

+ (BOOL)isAttachment:(id)item
{
  return ([item isKindOfClass:[UIImage class]] ||
          [item isKindOfClass:[NSData class]] ||
          [item isKindOfClass:[FBSDKGraphRequestDataAttachment class]]);
}


+ (NSString *)serializeURL:(NSString *)baseUrl
                    params:(NSDictionary *)params {
  return [self serializeURL:baseUrl params:params httpMethod:kGetHTTPMethod];
}

+ (NSString *)serializeURL:(NSString *)baseUrl
                    params:(NSDictionary *)params
                httpMethod:(NSString *)httpMethod {
  return [self serializeURL:baseUrl params:params httpMethod:httpMethod forBatch:NO];
}

+ (NSString *)serializeURL:(NSString *)baseUrl
                    params:(NSDictionary *)params
                httpMethod:(NSString *)httpMethod
                  forBatch:(BOOL)forBatch {
  params = [self preprocessParams: params];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  NSURL *parsedURL = [NSURL URLWithString:[baseUrl stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
#pragma clang pop
  if ([httpMethod isEqualToString:kPostHTTPMethod] && !forBatch) {
    return baseUrl;
  }

  NSString *queryPrefix = parsedURL.query ? @"&" : @"?";

  NSString *query = [FBSDKInternalUtility queryStringWithDictionary:params error:NULL invalidObjectHandler:^id(id object, BOOL *stop) {
    if ([self isAttachment:object]) {
      if ([httpMethod isEqualToString:kGetHTTPMethod]) {
        [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors logEntry:@"can not use GET to upload a file"];
      }
      return nil;
    }
    return object;
  }];
  return [NSString stringWithFormat:@"%@%@%@", baseUrl, queryPrefix, query];
}

+ (NSDictionary *)preprocessParams:(NSDictionary *)params
{
  NSString *debugValue = [FBSDKSettings graphAPIDebugParamValue];
  if (debugValue) {
    NSMutableDictionary *mutableParams = [NSMutableDictionary dictionaryWithDictionary:params];
    [mutableParams setObject:debugValue forKey:@"debug"];
    return mutableParams;
  }

  return params;
}

- (FBSDKGraphRequestConnection *)startWithCompletionHandler:(FBSDKGraphRequestHandler)handler
{
  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
  [connection addRequest:self completionHandler:handler];
  [connection start];
  return connection;
}

#pragma mark - Debugging helpers

- (NSString *)description
{
  NSMutableString *result = [NSMutableString stringWithFormat:@"<%@: %p",
                             NSStringFromClass([self class]),
                             self];
  if (self.graphPath) {
    [result appendFormat:@", graphPath: %@", self.graphPath];
  }
  if (self.HTTPMethod) {
    [result appendFormat:@", HTTPMethod: %@", self.HTTPMethod];
  }
  [result appendFormat:@", parameters: %@>", [self.parameters description]];
  return result;
}

@end
