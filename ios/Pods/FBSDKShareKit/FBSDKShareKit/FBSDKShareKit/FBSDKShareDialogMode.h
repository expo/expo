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

#import <FBSDKCoreKit/FBSDKMacros.h>

/**
 NS_ENUM(NSUInteger, FBSDKShareDialogMode)
  Modes for the FBSDKShareDialog.

 The automatic mode will progressively check the availability of different modes and open the most
 appropriate mode for the dialog that is available.
 */
typedef NS_ENUM(NSUInteger, FBSDKShareDialogMode)
{
  /**
    Acts with the most appropriate mode that is available.
   */
  FBSDKShareDialogModeAutomatic = 0,
  /**
   @Displays the dialog in the main native Facebook app.
   */
  FBSDKShareDialogModeNative,
  /**
   @Displays the dialog in the iOS integrated share sheet.
   */
  FBSDKShareDialogModeShareSheet,
  /**
   @Displays the dialog in Safari.
   */
  FBSDKShareDialogModeBrowser,
  /**
   @Displays the dialog in a UIWebView within the app.
   */
  FBSDKShareDialogModeWeb,
  /**
   @Displays the feed dialog in Safari.
   */
  FBSDKShareDialogModeFeedBrowser,
  /**
   @Displays the feed dialog in a UIWebView within the app.
   */
  FBSDKShareDialogModeFeedWeb,
};

/**
  Converts an FBLikeControlObjectType to an NSString.
 */
FBSDK_EXTERN NSString *NSStringFromFBSDKShareDialogMode(FBSDKShareDialogMode dialogMode);
