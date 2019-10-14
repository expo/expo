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

NS_ASSUME_NONNULL_BEGIN

NS_SWIFT_NAME(SDKError)
@interface FBSDKError : NSObject

+ (NSError *)errorWithCode:(NSInteger)code message:(nullable NSString *)message;

+ (NSError *)errorWithDomain:(NSErrorDomain)domain code:(NSInteger)code message:(nullable NSString *)message;

+ (NSError *)errorWithCode:(NSInteger)code
                   message:(nullable NSString *)message
           underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)errorWithDomain:(NSErrorDomain)domain
                        code:(NSInteger)code
                     message:(nullable NSString *)message
             underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)errorWithCode:(NSInteger)code
                  userInfo:(NSDictionary<NSErrorUserInfoKey, id> *)userInfo
                   message:(nullable NSString *)message
           underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)errorWithDomain:(NSErrorDomain)domain
                        code:(NSInteger)code
                    userInfo:(NSDictionary<NSErrorUserInfoKey, id> *)userInfo
                     message:(nullable NSString *)message
             underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)invalidArgumentErrorWithName:(NSString *)name
                                    value:(nullable id)value
                                  message:(nullable NSString *)message;

+ (NSError *)invalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                       name:(NSString *)name
                                      value:(nullable id)value
                                    message:(nullable NSString *)message;

+ (NSError *)invalidArgumentErrorWithName:(NSString *)name
                                    value:(nullable id)value
                                  message:(nullable NSString *)message
                          underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)invalidArgumentErrorWithDomain:(NSErrorDomain)domain
                                       name:(NSString *)name
                                      value:(nullable id)value
                                    message:(nullable NSString *)message
                            underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)invalidCollectionErrorWithName:(NSString *)name
                                 collection:(id<NSFastEnumeration>)collection
                                       item:(id)item
                                    message:(nullable NSString *)message;

+ (NSError *)invalidCollectionErrorWithName:(NSString *)name
                                 collection:(id<NSFastEnumeration>)collection
                                       item:(id)item
                                    message:(nullable NSString *)message
                            underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)requiredArgumentErrorWithName:(NSString *)name message:(nullable NSString *)message;

+ (NSError *)requiredArgumentErrorWithDomain:(NSErrorDomain)domain
                                        name:(NSString *)name
                                     message:(nullable NSString *)message;

+ (NSError *)requiredArgumentErrorWithName:(NSString *)name
                                   message:(nullable NSString *)message
                           underlyingError:(nullable NSError *)underlyingError;

+ (NSError *)unknownErrorWithMessage:(NSString *)message;

+ (BOOL)isNetworkError:(NSError *)error;
+ (void)enableErrorReport;

@end

NS_ASSUME_NONNULL_END
