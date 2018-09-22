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
#import <FBSDKShareKit/FBSDKSharingContent.h>

typedef NS_ENUM(NSUInteger, FBSDKShareMessengerMediaTemplateMediaType) {
  FBSDKShareMessengerMediaTemplateMediaTypeImage = 0,
  FBSDKShareMessengerMediaTemplateMediaTypeVideo
};

/**
 A model for sharing media template content. See
 https://developers.facebook.com/docs/messenger-platform/send-messages/template/media for details.
 */
@interface FBSDKShareMessengerMediaTemplateContent : NSObject <FBSDKSharingContent>

/**
 The media type (image or video) for this content. This must match the media type specified in the
 attachmentID/mediaURL to avoid an error when sharing. Defaults to image.
 */
@property (nonatomic, assign) FBSDKShareMessengerMediaTemplateMediaType mediaType;

/**
 The attachmentID of the item to share. Optional, but either attachmentID or mediaURL must be specified.
 */
@property (nonatomic, copy, readonly) NSString *attachmentID;

/**
 The Facebook url for this piece of media. External urls will not work; this must be a Facebook url.
 See https://developers.facebook.com/docs/messenger-platform/send-messages/template/media for details.
 Optional, but either attachmentID or mediaURL must be specified.
 */
@property (nonatomic, copy, readonly) NSURL *mediaURL;

/**
 This specifies what action button to show below the media. Optional.
 */
@property (nonatomic, copy) id<FBSDKShareMessengerActionButton> button;

/**
 Custom initializer to create media template share with attachment id.
 */
- (instancetype)initWithAttachmentID:(NSString *)attachmentID;

/**
 Custom initializer to create media template share with media url. This must be a Facebook url
 and cannot be an external url.
 */
- (instancetype)initWithMediaURL:(NSURL *)mediaURL;

@end
