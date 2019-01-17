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

#import <FBSDKShareKit/FBSDKShareLinkContent.h>
#import <FBSDKShareKit/FBSDKShareMediaContent.h>
#import <FBSDKShareKit/FBSDKShareOpenGraphContent.h>
#import <FBSDKShareKit/FBSDKSharePhotoContent.h>
#import <FBSDKShareKit/FBSDKShareVideoContent.h>
#import <FBSDKShareKit/FBSDKSharingContent.h>

@interface FBSDKShareUtility : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

+ (void)assertCollection:(id<NSFastEnumeration>)collection ofClass:itemClass name:(NSString *)name;
+ (void)assertCollection:(id<NSFastEnumeration>)collection ofClassStrings:(NSArray *)classStrings name:(NSString *)name;
+ (void)assertOpenGraphKey:(id)key requireNamespace:(BOOL)requireNamespace;
+ (void)assertOpenGraphValue:(id)value;
+ (void)assertOpenGraphValues:(NSDictionary *)dictionary requireKeyNamespace:(BOOL)requireKeyNamespace;

+ (BOOL)buildWebShareContent:(id<FBSDKSharingContent>)content
                  methodName:(NSString *__autoreleasing *)methodNameRef
                  parameters:(NSDictionary *__autoreleasing *)parametersRef
                       error:(NSError *__autoreleasing *)errorRef;
+ (NSString *)buildWebShareTags:(NSArray<NSString *> *)peopleIDs;
+ (void)buildAsyncWebPhotoContent:(FBSDKSharePhotoContent *)content
                completionHandler:(void(^)(BOOL, NSString *, NSDictionary *))completion;
+ (id)convertOpenGraphValue:(id)value;
+ (NSDictionary<NSString *, id> *)convertOpenGraphValueContainer:(FBSDKShareOpenGraphValueContainer *)container
                                                requireNamespace:(BOOL)requireNamespace;
+ (NSDictionary<NSString *, id> *)convertOpenGraphValues:(NSDictionary<NSString *, id> *)dictionary;
+ (NSDictionary<NSString *, id> *)convertPhoto:(FBSDKSharePhoto *)photo;
+ (NSDictionary *)feedShareDictionaryForContent:(id<FBSDKSharingContent>)content;
+ (NSString *)getOpenGraphNameAndNamespaceFromFullName:(NSString *)fullName namespace:(NSString **)namespace;
+ (NSString *)hashtagStringFromHashtag:(FBSDKHashtag *)hashtag;
+ (UIImage *)imageWithCircleColor:(UIColor *)color
                       canvasSize:(CGSize)canvasSize
                       circleSize:(CGSize)circleSize;
+ (NSDictionary *)parametersForShareContent:(id<FBSDKSharingContent>)shareContent
                              bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
                      shouldFailOnDataError:(BOOL)shouldFailOnDataError;
+ (void)testShareContent:(id<FBSDKSharingContent>)shareContent
           containsMedia:(BOOL *)containsMediaRef
          containsPhotos:(BOOL *)containsPhotosRef
          containsVideos:(BOOL *)containsVideosRef;
+ (BOOL)shareMediaContentContainsPhotosAndVideos:(FBSDKShareMediaContent *)shareMediaContent;

+ (BOOL)validateArgumentWithName:(NSString *)argumentName
                           value:(NSUInteger)value
                            isIn:(NSArray<NSNumber *> *)possibleValues
                           error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateArray:(NSArray<id> *)array
             minCount:(NSUInteger)minCount
             maxCount:(NSUInteger)maxCount
                 name:(NSString *)name
                error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateNetworkURL:(NSURL *)URL name:(NSString *)name error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateRequiredValue:(id)value name:(NSString *)name error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateShareContent:(id<FBSDKSharingContent>)shareContent
               bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
                       error:(NSError *__autoreleasing *)errorRef;

@end
