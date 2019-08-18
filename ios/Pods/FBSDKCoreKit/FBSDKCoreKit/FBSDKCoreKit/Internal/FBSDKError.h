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

#import <Foundation/Foundation.h>

@interface NSError (FBSDKError)

+ (NSError *)fbErrorWithCode:(NSInteger)code message:(NSString *)message;
+ (NSError *)fbErrorWithDomain:(NSErrorDomain)domain
                          code:(NSInteger)code
                       message:(NSString *)message;

+ (NSError *)fbErrorWithCode:(NSInteger)code
                     message:(NSString *)message
             underlyingError:(NSError *)underlyingError;

+ (NSError *)fbErrorWithDomain:(NSErrorDomain)domain
                          code:(NSInteger)code
                       message:(NSString *)message
               underlyingError:(NSError *)underlyingError;

+ (NSError *)fbErrorWithCode:(NSInteger)code
                    userInfo:(NSDictionary<NSErrorUserInfoKey, id> *)userInfo
                     message:(NSString *)message
             underlyingError:(NSError *)underlyingError;

+ (NSError *)fbErrorWithDomain:(NSErrorDomain)domain
                          code:(NSInteger)code
                      userInfo:(NSDictionary<NSErrorUserInfoKey, id> *)userInfo
                       message:(NSString *)message
               underlyingError:(NSError *)underlyingError;

+ (NSError *)fbInvalidArgumentErrorWithName:(NSString *)name
                                      value:(id)value
                                    message:(NSString *)message;

+ (NSError *)fbInvalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                         name:(NSString *)name
                                        value:(id)value
                                      message:(NSString *)message;

+ (NSError *)fbInvalidArgumentErrorWithName:(NSString *)name
                                      value:(id)value
                                    message:(NSString *)message
                            underlyingError:(NSError *)underlyingError;

+ (NSError *)fbInvalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                         name:(NSString *)name
                                        value:(id)value
                                      message:(NSString *)message
                              underlyingError:(NSError *)underlyingError;

+ (NSError *)fbInvalidCollectionErrorWithName:(NSString *)name
                                   collection:(id<NSFastEnumeration>)collection
                                         item:(id)item
                                      message:(NSString *)message;

+ (NSError *)fbInvalidCollectionErrorWithName:(NSString *)name
                                   collection:(id<NSFastEnumeration>)collection
                                         item:(id)item
                                      message:(NSString *)message
                              underlyingError:(NSError *)underlyingError;

+ (NSError *)fbRequiredArgumentErrorWithName:(NSString *)name message:(NSString *)message;
+ (NSError *)fbRequiredArgumentErrorWithDomain:(NSErrorDomain)domain
                                          name:(NSString *)name
                                       message:(NSString *)message;

+ (NSError *)fbRequiredArgumentErrorWithName:(NSString *)name
                                     message:(NSString *)message
                             underlyingError:(NSError *)underlyingError;

+ (NSError *)fbUnknownErrorWithMessage:(NSString *)message;

@property (nonatomic, assign, readonly, getter=isNetworkError) BOOL networkError
NS_SWIFT_NAME(isNetworkError);

@end
