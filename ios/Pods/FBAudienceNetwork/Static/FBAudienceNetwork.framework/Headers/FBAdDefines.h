// Copyright 2004-present Facebook. All Rights Reserved.
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

#ifndef FBAudienceNetwork_FBAdDefines_h
#define FBAudienceNetwork_FBAdDefines_h

#ifdef __cplusplus
#define FB_EXTERN_C_BEGIN  extern "C" {
#define FB_EXTERN_C_END  }
#else
#define FB_EXTERN_C_BEGIN
#define FB_EXTERN_C_END
#endif

#ifdef __cplusplus
# define FB_EXPORT extern "C" __attribute__((visibility("default")))
#else
# define FB_EXPORT extern __attribute__((visibility("default")))
#endif

#define FB_CLASS_EXPORT __attribute__((visibility("default")))
#define FB_DEPRECATED __attribute__((deprecated))

#if __has_feature(objc_generics)
#define FB_NSArrayOf(x) NSArray<x>
#define FB_NSMutableArrayOf(x) NSMutableArray<x>
#define FB_NSDictionaryOf(x,y) NSDictionary<x, y>
#define FB_NSMutableDictionaryOf(x, y) NSMutableDictionary<x, y>
#define FB_NSSetOf(x) NSSet<x>
#define FB_NSMutableSetOf(x) NSMutableSet<x>
#else
#define FB_NSArrayOf(x) NSArray
#define FB_NSMutableArrayOf(x) NSMutableArray
#define FB_NSDictionaryOf(x,y) NSDictionary
#define FB_NSMutableDictionaryOf(x, y) NSMutableDictionary
#define FB_NSSetOf(x) NSSet
#define FB_NSMutableSetOf(x) NSMutableSet
#define __covariant
#endif

#if ! __has_feature(nullability)
#define NS_ASSUME_NONNULL_BEGIN
#define NS_ASSUME_NONNULL_END
#define nullable
#define __nullable
#endif

#ifndef FB_IOS9_SDK_OR_LATER
#define FB_IOS9_SDK_OR_LATER (__IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_9_0)
#endif

#ifndef FBInterfaceOrientationMask
#if !FB_IOS9_SDK_OR_LATER
#define FBInterfaceOrientationMask NSUInteger
#else
#define FBInterfaceOrientationMask UIInterfaceOrientationMask
#endif // FB_IOS9_SDK_OR_LATER
#endif // FBInterfaceOrientationMask

#ifndef FB_SUBCLASSING_RESTRICTED
#if defined(__has_attribute) && __has_attribute(objc_subclassing_restricted)
#define FB_SUBCLASSING_RESTRICTED __attribute__((objc_subclassing_restricted))
#else
#define FB_SUBCLASSING_RESTRICTED
#endif
#endif

#endif
