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

#import <FBSDKShareKit/FBSDKShareMessengerActionButton.h>

typedef NS_ENUM(NSUInteger, FBSDKShareMessengerURLActionButtonWebviewHeightRatio) {
  FBSDKShareMessengerURLActionButtonWebviewHeightRatioFull = 0,
  FBSDKShareMessengerURLActionButtonWebviewHeightRatioTall,
  FBSDKShareMessengerURLActionButtonWebviewHeightRatioCompact
};

/**
 A model for a Messenger share URL action button.
 */
@interface FBSDKShareMessengerURLActionButton : NSObject <FBSDKShareMessengerActionButton>

/**
 The url that this button should open when tapped. Required.
 */
@property (nonatomic, copy) NSURL *url;

/**
 This controls the display height of the webview when shown in the Messenger app. Defaults to Full.
 */
@property (nonatomic, assign) FBSDKShareMessengerURLActionButtonWebviewHeightRatio webviewHeightRatio;

/**
 This must be true if the url is a Messenger Extensions url. Defaults to NO.
 */
@property (nonatomic, assign) BOOL isMessengerExtensionURL;

/**
 This is a fallback url for a Messenger Extensions enabled button. It is used on clients that do not support
 Messenger Extensions. If this is not defined, the url will be used as a fallback. Optional, but ignored
 unless isMessengerExtensionURL == YES.
 */
@property (nonatomic, copy) NSURL *fallbackURL;

/**
 This controls whether we want to hide the share button in the webview or not. It is useful to hide the share
 button when the webview is user-specific and contains sensitive information. Defaults to NO.
 */
@property (nonatomic, assign) BOOL shouldHideWebviewShareButton;

@end
