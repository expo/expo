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

#if !TARGET_OS_TV
#import <FBSDKShareKit/FBSDKAppInviteContent.h>
#import <FBSDKShareKit/FBSDKGameRequestContent.h>
#import <FBSDKShareKit/FBSDKShareCameraEffectContent.h>
#endif

@interface FBSDKShareUtility : NSObject

+ (void)assertCollection:(id<NSFastEnumeration>)collection ofClass:itemClass name:(NSString *)name;
+ (void)assertCollection:(id<NSFastEnumeration>)collection ofClassStrings:(NSArray *)classStrings name:(NSString *)name;
+ (void)assertOpenGraphKey:(id)key requireNamespace:(BOOL)requireNamespace;
+ (void)assertOpenGraphValue:(id)value;
+ (void)assertOpenGraphValues:(NSDictionary *)dictionary requireKeyNamespace:(BOOL)requireKeyNamespace;
+ (id)convertOpenGraphValue:(id)value;
+ (BOOL)buildWebShareContent:(id<FBSDKSharingContent>)content
                  methodName:(NSString *__autoreleasing *)methodNameRef
                  parameters:(NSDictionary *__autoreleasing *)parametersRef
                       error:(NSError *__autoreleasing *)errorRef;
+ (void)buildAsyncWebPhotoContent:(FBSDKSharePhotoContent *)content
                completionHandler:(void(^)(BOOL, NSString *, NSDictionary *))completion;
+ (NSDictionary *)convertOpenGraphValues:(NSDictionary *)dictionary;
+ (NSDictionary *)feedShareDictionaryForContent:(id<FBSDKSharingContent>)content;
+ (NSString *)hashtagStringFromHashtag:(FBSDKHashtag *)hashtag;
+ (UIImage *)imageWithCircleColor:(UIColor *)color
                       canvasSize:(CGSize)canvasSize
                       circleSize:(CGSize)circleSize;
+ (NSDictionary *)parametersForShareContent:(id<FBSDKSharingContent>)shareContent
                      shouldFailOnDataError:(BOOL)shouldFailOnDataError;
+ (void)testShareContent:(id<FBSDKSharingContent>)shareContent
           containsMedia:(BOOL *)containsMediaRef
          containsPhotos:(BOOL *)containsPhotosRef
          containsVideos:(BOOL *)containsVideosRef;
+ (BOOL)shareMediaContentContainsPhotosAndVideos:(FBSDKShareMediaContent *)shareMediaContent;
+ (BOOL)validateAssetLibraryURLWithShareVideoContent:(FBSDKShareVideoContent *)videoContent name:(NSString *)name error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateAssetLibraryURLsWithShareMediaContent:(FBSDKShareMediaContent *)mediaContent name:(NSString *)name error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateShareContent:(id<FBSDKSharingContent>)shareContent error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateShareLinkContent:(FBSDKShareLinkContent *)linkContent error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateShareMediaContent:(FBSDKShareMediaContent *)mediaContent error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateShareOpenGraphContent:(FBSDKShareOpenGraphContent *)openGraphContent
                                error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateSharePhotoContent:(FBSDKSharePhotoContent *)photoContent error:(NSError *__autoreleasing *)errorRef;
+ (NSString *)getOpenGraphNameAndNamespaceFromFullName:(NSString *)fullName namespace:(NSString **)namespace;

#if !TARGET_OS_TV
+ (BOOL)validateAppInviteContent:(FBSDKAppInviteContent *)appInviteContent error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateShareCameraEffectContent:(FBSDKShareCameraEffectContent *)ShareCameraEffectContent
                                   error:(NSError *__autoreleasing *)errorRef;
+ (BOOL)validateGameRequestContent:(FBSDKGameRequestContent *)gameRequestContent error:(NSError *__autoreleasing *)errorRef;
#endif
@end
