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

/**
  A model for status and link content to be shared.
 */
@interface FBSDKShareLinkContent : NSObject <FBSDKSharingContent>

/**
  The description of the link.

 If not specified, this field is automatically populated by information scraped from the contentURL,
 typically the title of the page.  This value may be discarded for specially handled links (ex: iTunes URLs).
 @return The description of the link

 @deprecated `contentDescription` is deprecated from Graph API 2.9.
 For more information, see https://developers.facebook.com/docs/apps/changelog#v2_9_deprecations.
 */
@property (nonatomic, readonly) NSString *contentDescription
  DEPRECATED_MSG_ATTRIBUTE("`contentDescription` is deprecated from Graph API 2.9");

/**
  The title to display for this link.

 This value may be discarded for specially handled links (ex: iTunes URLs).
 @return The link title

 @deprecated `contentTitle` is deprecated from Graph API 2.9.
 For more information, see https://developers.facebook.com/docs/apps/changelog#v2_9_deprecations
 */
@property (nonatomic, readonly) NSString *contentTitle
  DEPRECATED_MSG_ATTRIBUTE("`contentTitle` is deprecated from Graph API 2.9");

/**
  The URL of a picture to attach to this content.
 @return The network URL of an image

 @deprecated `imageURL` is deprecated from Graph API 2.9.
 For more information, see https://developers.facebook.com/docs/apps/changelog#v2_9_deprecations
 */
@property (nonatomic, readonly) NSURL *imageURL
  DEPRECATED_MSG_ATTRIBUTE("`imageURL` is deprecated from Graph API 2.9");

/**
  Some quote text of the link.

 If specified, the quote text will render with custom styling on top of the link.
 @return The quote text of a link
 */
@property (nonatomic, copy) NSString *quote;

/**
  Compares the receiver to another link content.
 @param content The other content
 @return YES if the receiver's values are equal to the other content's values; otherwise NO
 */
- (BOOL)isEqualToShareLinkContent:(FBSDKShareLinkContent *)content;

@end
