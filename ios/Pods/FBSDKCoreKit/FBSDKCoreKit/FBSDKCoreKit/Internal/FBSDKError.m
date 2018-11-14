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
#import "FBSDKInternalUtility.h"
#import "FBSDKTypeUtility.h"

@implementation NSError (FBSDKError)

#pragma mark - Class Methods

- (BOOL)isNetworkError
{
  NSError *innerError = self.userInfo[NSUnderlyingErrorKey];
  if (innerError && innerError.isNetworkError) {
    return YES;
  }

  switch (self.code) {
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

+ (NSError *)fbErrorWithCode:(NSInteger)code message:(NSString *)message
{
  return [self fbErrorWithCode:code message:message underlyingError:nil];
}

+ (NSError *)fbErrorWithDomain:(NSErrorDomain)domain
                          code:(NSInteger)code
                       message:(NSString *)message
{
  return [self fbErrorWithDomain:domain code:code message:message underlyingError:nil];
}

+ (NSError *)fbErrorWithCode:(NSInteger)code message:(NSString *)message underlyingError:(NSError *)underlyingError
{
  return [self fbErrorWithCode:code userInfo:nil message:message underlyingError:underlyingError];
}

+ (NSError *)fbErrorWithDomain:(NSErrorDomain)domain
                          code:(NSInteger)code
                       message:(NSString *)message
               underlyingError:(NSError *)underlyingError
{
  return [self fbErrorWithDomain:domain code:code userInfo:@{} message:message underlyingError:underlyingError];
}

+ (NSError *)fbErrorWithCode:(NSInteger)code
                    userInfo:(NSDictionary<NSErrorUserInfoKey, id> *)userInfo
                     message:(NSString *)message
             underlyingError:(NSError *)underlyingError
{
  return [self fbErrorWithDomain:FBSDKErrorDomain code:code userInfo:userInfo message:message underlyingError:underlyingError];
}

+ (NSError *)fbErrorWithDomain:(NSErrorDomain)domain
                          code:(NSInteger)code
                      userInfo:(NSDictionary<NSErrorUserInfoKey,id> *)userInfo
                       message:(NSString *)message
               underlyingError:(NSError *)underlyingError
{
  NSMutableDictionary *fullUserInfo = [[NSMutableDictionary alloc] initWithDictionary:userInfo];
  [FBSDKInternalUtility dictionary:fullUserInfo setObject:message forKey:FBSDKErrorDeveloperMessageKey];
  [FBSDKInternalUtility dictionary:fullUserInfo setObject:underlyingError forKey:NSUnderlyingErrorKey];
  userInfo = ([fullUserInfo count] ? [fullUserInfo copy] : nil);
  return [[NSError alloc] initWithDomain:domain code:code userInfo:userInfo];
}

+ (NSError *)fbInvalidArgumentErrorWithName:(NSString *)name value:(id)value message:(NSString *)message
{
  return [self fbInvalidArgumentErrorWithName:name value:value message:message underlyingError:nil];
}

+ (NSError *)fbInvalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                         name:(NSString *)name
                                        value:(id)value
                                      message:(NSString *)message
{
  return [self fbInvalidArgumentErrorWithDomain:domain
                                           name:name
                                          value:value
                                        message:message
                                underlyingError:nil];
}

+ (NSError *)fbInvalidArgumentErrorWithName:(NSString *)name
                                      value:(id)value
                                    message:(NSString *)message
                            underlyingError:(NSError *)underlyingError
{
  return [self fbInvalidArgumentErrorWithDomain:FBSDKErrorDomain
                                           name:name
                                          value:value
                                        message:message
                                underlyingError:underlyingError];
}
+ (NSError *)fbInvalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                         name:(NSString *)name
                                        value:(id)value
                                      message:(NSString *)message
                              underlyingError:(NSError *)underlyingError
{
  if (!message) {
    message = [[NSString alloc] initWithFormat:@"Invalid value for %@: %@", name, value];
  }
  NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
  [FBSDKInternalUtility dictionary:userInfo setObject:name forKey:FBSDKErrorArgumentNameKey];
  [FBSDKInternalUtility dictionary:userInfo setObject:value forKey:FBSDKErrorArgumentValueKey];
  return [self fbErrorWithDomain:domain
                            code:FBSDKErrorInvalidArgument
                        userInfo:userInfo
                         message:message
                 underlyingError:underlyingError];
}

+ (NSError *)fbInvalidCollectionErrorWithName:(NSString *)name
                                   collection:(id<NSFastEnumeration>)collection
                                         item:(id)item
                                      message:(NSString *)message
{
  return [self fbInvalidCollectionErrorWithName:name collection:collection item:item message:message underlyingError:nil];
}

+ (NSError *)fbInvalidCollectionErrorWithName:(NSString *)name
                                   collection:(id<NSFastEnumeration>)collection
                                         item:(id)item
                                      message:(NSString *)message
                              underlyingError:(NSError *)underlyingError
{
  if (!message) {
    message = [[NSString alloc] initWithFormat:@"Invalid item (%@) found in collection for %@: %@", item, name, collection];
  }
  NSMutableDictionary *userInfo = [[NSMutableDictionary alloc] init];
  [FBSDKInternalUtility dictionary:userInfo setObject:name forKey:FBSDKErrorArgumentNameKey];
  [FBSDKInternalUtility dictionary:userInfo setObject:item forKey:FBSDKErrorArgumentValueKey];
  [FBSDKInternalUtility dictionary:userInfo setObject:collection forKey:FBSDKErrorArgumentCollectionKey];
  return [self fbErrorWithCode:FBSDKErrorInvalidArgument
                      userInfo:userInfo
                       message:message
               underlyingError:underlyingError];
}

+ (NSError *)fbRequiredArgumentErrorWithName:(NSString *)name message:(NSString *)message
{
  return [self fbRequiredArgumentErrorWithName:name message:message underlyingError:nil];
}

+ (NSError *)fbRequiredArgumentErrorWithDomain:(NSErrorDomain)domain
                                          name:(NSString *)name
                                       message:(NSString *)message
{
  if (!message) {
    message = [[NSString alloc] initWithFormat:@"Value for %@ is required.", name];
  }
  return [self fbInvalidArgumentErrorWithDomain:domain name:name value:nil message:message underlyingError:nil];
}

+ (NSError *)fbRequiredArgumentErrorWithName:(NSString *)name
                                     message:(NSString *)message
                             underlyingError:(NSError *)underlyingError
{
  if (!message) {
    message = [[NSString alloc] initWithFormat:@"Value for %@ is required.", name];
  }
  return [self fbInvalidArgumentErrorWithName:name value:nil message:message underlyingError:underlyingError];
}

+ (NSError *)fbUnknownErrorWithMessage:(NSString *)message
{
  return [self fbErrorWithCode:FBSDKErrorUnknown
                      userInfo:nil
                       message:message
               underlyingError:nil];
}

@end
