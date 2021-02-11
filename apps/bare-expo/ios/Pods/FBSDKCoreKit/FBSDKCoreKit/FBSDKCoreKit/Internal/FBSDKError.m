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

#import "FBSDKError.h"

#import "FBSDKConstants.h"
#import "FBSDKErrorReport.h"
#import "FBSDKFeatureManager.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKSettings.h"

@implementation FBSDKError

static BOOL isErrorReportEnabled = NO;

#pragma mark - Class Methods

+ (NSError *)errorWithCode:(NSInteger)code message:(NSString *)message
{
  return [self errorWithCode:code message:message underlyingError:nil];
}

+ (NSError *)errorWithDomain:(NSErrorDomain)domain code:(NSInteger)code message:(NSString *)message
{
  return [self errorWithDomain:domain code:code message:message underlyingError:nil];
}

+ (NSError *)errorWithCode:(NSInteger)code message:(NSString *)message underlyingError:(NSError *)underlyingError
{
  return [self errorWithCode:code userInfo:@{} message:message underlyingError:underlyingError];
}

+ (NSError *)errorWithDomain:(NSErrorDomain)domain
                        code:(NSInteger)code
                     message:(NSString *)message
             underlyingError:(NSError *)underlyingError
{
  return [self errorWithDomain:domain code:code userInfo:@{} message:message underlyingError:underlyingError];
}

+ (NSError *)errorWithCode:(NSInteger)code
                  userInfo:(NSDictionary<NSErrorUserInfoKey, id> *)userInfo
                   message:(NSString *)message
           underlyingError:(NSError *)underlyingError
{
  return [self errorWithDomain:FBSDKErrorDomain
                          code:code
                      userInfo:userInfo
                       message:message
               underlyingError:underlyingError];
}

+ (NSError *)errorWithDomain:(NSErrorDomain)domain
                        code:(NSInteger)code
                    userInfo:(NSDictionary<NSErrorUserInfoKey, id> *)userInfo
                     message:(NSString *)message
             underlyingError:(NSError *)underlyingError
{
  NSMutableDictionary *fullUserInfo = [[NSMutableDictionary alloc] initWithDictionary:userInfo];
  [FBSDKTypeUtility dictionary:fullUserInfo setObject:message forKey:FBSDKErrorDeveloperMessageKey];
  [FBSDKTypeUtility dictionary:fullUserInfo setObject:underlyingError forKey:NSUnderlyingErrorKey];
  userInfo = fullUserInfo.count ? [fullUserInfo copy] : nil;
  if (isErrorReportEnabled) {
    [FBSDKErrorReport saveError:code errorDomain:domain message:message];
  }

  return [[NSError alloc] initWithDomain:domain code:code userInfo:userInfo];
}

+ (NSError *)invalidArgumentErrorWithName:(NSString *)name value:(id)value message:(NSString *)message
{
  return [self invalidArgumentErrorWithName:name value:value message:message underlyingError:nil];
}

+ (NSError *)invalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                       name:(NSString *)name
                                      value:(id)value
                                    message:(NSString *)message
{
  return [self invalidArgumentErrorWithDomain:domain name:name value:value message:message underlyingError:nil];
}

+ (NSError *)invalidArgumentErrorWithName:(NSString *)name
                                    value:(id)value
                                  message:(NSString *)message
                          underlyingError:(NSError *)underlyingError
{
  return [self invalidArgumentErrorWithDomain:FBSDKErrorDomain
                                         name:name
                                        value:value
                                      message:message
                              underlyingError:underlyingError];
}

+ (NSError *)invalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                       name:(NSString *)name
                                      value:(id)value
                                    message:(NSString *)message
                            underlyingError:(NSError *)underlyingError
{
  if (!message) {
    message = [[NSString alloc] initWithFormat:@"Invalid value for %@: %@", name, value];
  }
  NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
  [FBSDKTypeUtility dictionary:userInfo setObject:name forKey:FBSDKErrorArgumentNameKey];
  [FBSDKTypeUtility dictionary:userInfo setObject:value forKey:FBSDKErrorArgumentValueKey];
  return [self errorWithDomain:domain
                          code:FBSDKErrorInvalidArgument
                      userInfo:userInfo
                       message:message
               underlyingError:underlyingError];
}

+ (NSError *)invalidCollectionErrorWithName:(NSString *)name
                                 collection:(id<NSFastEnumeration>)collection
                                       item:(id)item
                                    message:(NSString *)message
{
  return [self invalidCollectionErrorWithName:name collection:collection item:item message:message underlyingError:nil];
}

+ (NSError *)invalidCollectionErrorWithName:(NSString *)name
                                 collection:(id<NSFastEnumeration>)collection
                                       item:(id)item
                                    message:(NSString *)message
                            underlyingError:(NSError *)underlyingError
{
  if (!message) {
    message =
    [[NSString alloc] initWithFormat:@"Invalid item (%@) found in collection for %@: %@", item, name, collection];
  }
  NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
  [FBSDKTypeUtility dictionary:userInfo setObject:name forKey:FBSDKErrorArgumentNameKey];
  [FBSDKTypeUtility dictionary:userInfo setObject:item forKey:FBSDKErrorArgumentValueKey];
  [FBSDKTypeUtility dictionary:userInfo setObject:collection forKey:FBSDKErrorArgumentCollectionKey];
  return [self errorWithCode:FBSDKErrorInvalidArgument
                    userInfo:userInfo
                     message:message
             underlyingError:underlyingError];
}

+ (NSError *)requiredArgumentErrorWithName:(NSString *)name message:(NSString *)message
{
  return [self requiredArgumentErrorWithName:name message:message underlyingError:nil];
}

+ (NSError *)requiredArgumentErrorWithDomain:(NSErrorDomain)domain name:(NSString *)name message:(NSString *)message
{
  if (!message) {
    message = [[NSString alloc] initWithFormat:@"Value for %@ is required.", name];
  }
  return [self invalidArgumentErrorWithDomain:domain name:name value:nil message:message underlyingError:nil];
}

+ (NSError *)requiredArgumentErrorWithName:(NSString *)name
                                   message:(NSString *)message
                           underlyingError:(NSError *)underlyingError
{
  if (!message) {
    message = [[NSString alloc] initWithFormat:@"Value for %@ is required.", name];
  }
  return [self invalidArgumentErrorWithName:name value:nil message:message underlyingError:underlyingError];
}

+ (NSError *)unknownErrorWithMessage:(NSString *)message
{
  return [self errorWithCode:FBSDKErrorUnknown userInfo:@{} message:message underlyingError:nil];
}

+ (BOOL)isNetworkError:(NSError *)error
{
  NSError *innerError = error.userInfo[NSUnderlyingErrorKey];
  if (innerError && [self isNetworkError:innerError]) {
    return YES;
  }

  switch (error.code) {
    case NSURLErrorTimedOut:
    case NSURLErrorCannotFindHost:
    case NSURLErrorCannotConnectToHost:
    case NSURLErrorNetworkConnectionLost:
    case NSURLErrorDNSLookupFailed:
    case NSURLErrorNotConnectedToInternet:
    case NSURLErrorInternationalRoamingOff:
    case NSURLErrorCallIsActive:
    case NSURLErrorDataNotAllowed:
      return YES;
    default:
      return NO;
  }
}

+ (void)enableErrorReport
{
  isErrorReportEnabled = YES;
}

@end
