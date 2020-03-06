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

/***
 * This is a bridge file for Audience Network Unity SDK.
 *
 * This file may be used to build your own Audience Network iOS SDK wrapper,
 * but note that we don't support customisations of the Audience Network codebase.
 *
 ***/

#import <UIKit/UIKit.h>

#import <FBAudienceNetwork/FBAdBridgeContainer.h>
#import <FBAudienceNetwork/FBAdDefines.h>

FB_EXTERN_C_BEGIN

// External to this project
typedef NS_ENUM(NSInteger, FBGLViewController) {
    FBGLViewControllerNone,
    FBGLViewControllerUnity,
    FBGLViewControllerCocos2D,
};

__attribute__((weak)) extern UIViewController *UnityGetGLViewController(void);
__attribute__((__always_inline__)) extern FBGLViewController fbad_Cocos2DGetGLViewController(
    UIViewController **glViewController);

__attribute__((__always_inline__)) extern UIViewController *fbad_GetGLViewController(void);
__attribute__((__always_inline__)) extern FBGLViewController fbad_UnityGetGLViewController(
    UIViewController **glViewController);

FB_EXTERN_C_END
