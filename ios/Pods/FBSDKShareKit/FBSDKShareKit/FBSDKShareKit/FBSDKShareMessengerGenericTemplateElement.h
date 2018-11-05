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

#import <FBSDKCoreKit/FBSDKCopying.h>
#import <FBSDKShareKit/FBSDKShareMessengerActionButton.h>

/**
 A model for sharing a generic template element to Messenger. This allows specifying title, subtitle,
 image, default action, and any other buttons. Title is required. See
 https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic for more details.
 */
@interface FBSDKShareMessengerGenericTemplateElement : NSObject <FBSDKCopying, NSSecureCoding>

/**
 The rendered title for the shared generic template element. Required.
 */
@property (nonatomic, copy) NSString *title;

/**
 The rendered subtitle for the shared generic template element. Optional.
 */
@property (nonatomic, copy) NSString *subtitle;

/**
 The image url that will be downloaded and rendered at the top of the generic template. Optional.
 */
@property (nonatomic, copy) NSURL *imageURL;

/**
 The default action executed when this shared generic tempate is tapped. Title for this button is ignored. Optional.
 */
@property (nonatomic, copy) id<FBSDKShareMessengerActionButton> defaultAction;

/**
 This specifies what action button to show below the generic template. Optional.
 */
@property (nonatomic, copy) id<FBSDKShareMessengerActionButton> button;

@end
