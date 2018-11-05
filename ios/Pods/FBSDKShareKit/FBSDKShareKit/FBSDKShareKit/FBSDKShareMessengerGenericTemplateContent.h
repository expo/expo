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

#import <FBSDKShareKit/FBSDKSharingContent.h>

@class FBSDKShareMessengerGenericTemplateElement;

typedef NS_ENUM(NSUInteger, FBSDKShareMessengerGenericTemplateImageAspectRatio) {
  FBSDKShareMessengerGenericTemplateImageAspectRatioHorizontal = 0,
  FBSDKShareMessengerGenericTemplateImageAspectRatioSquare
};

/**
 A model for sharing a generic template element to Messenger. This wrapper element allows
 specifying whether or not the bubble is sharable and what aspect to render the images.
 See https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic
 for more details.
 */
@interface FBSDKShareMessengerGenericTemplateContent : NSObject <FBSDKSharingContent>

/**
 This specifies whether or not this generic template message can be shared again after the
 initial share. Defaults to false.
 */
@property (nonatomic, assign) BOOL isSharable;

/**
 The aspect ratio for when the image is rendered in the generic template bubble after being
 shared. Defaults to horizontal.
 */
@property (nonatomic, assign) FBSDKShareMessengerGenericTemplateImageAspectRatio imageAspectRatio;

/**
 A generic template element with a title, optional subtitle, optional image, etc. Required.
 */
@property (nonatomic, copy) FBSDKShareMessengerGenericTemplateElement *element;

@end
