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

#ifndef FBSDK_CAST_TO_CLASS_OR_NIL_FUNC
 #define FBSDK_CAST_TO_CLASS_OR_NIL_FUNC
 #ifdef __cplusplus
extern "C" {
 #endif
/** Use the type-safe FBSDK_CAST_TO_CLASS_OR_NIL instead. */
id _FBSDKCastToClassOrNilUnsafeInternal(id object, Class klass);
 #ifdef __cplusplus
}
 #endif
#endif

#ifndef FBSDK_CAST_TO_CLASS_OR_NIL
 #define FBSDK_CAST_TO_CLASS_OR_NIL(obj_, class_) ((class_ *)_FBSDKCastToClassOrNilUnsafeInternal(obj_, [class_ class]))
#endif

#ifndef FBSDK_CAST_TO_PROTOCOL_OR_NIL_FUNC
 #define FBSDK_CAST_TO_PROTOCOL_OR_NIL_FUNC
 #ifdef __cplusplus
extern "C" {
 #endif
/** Use the type-safe FBSDK_CAST_TO_PROTOCOL_OR_NIL instead. */
id _FBSDKCastToProtocolOrNilUnsafeInternal(id object, Protocol *protocol);
 #ifdef __cplusplus
}
 #endif
#endif

#ifndef FBSDK_CAST_TO_PROTOCOL_OR_NIL
 #define FBSDK_CAST_TO_PROTOCOL_OR_NIL(obj_, protocol_) ((id<protocol_>)_FBSDKCastToProtocolOrNilUnsafeInternal(obj_, @protocol(protocol_)))
#endif
