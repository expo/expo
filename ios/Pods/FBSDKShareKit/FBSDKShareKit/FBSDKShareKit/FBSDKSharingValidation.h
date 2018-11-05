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

/**
 Flags to indicate support for newer bridge options beyond the initial 20130410 implementation.
 */
typedef NS_OPTIONS(NSUInteger, FBSDKShareBridgeOptions)
{
  FBSDKShareBridgeOptionsDefault       = 0,
  FBSDKShareBridgeOptionsPhotoAsset    = 1 << 0,
  FBSDKShareBridgeOptionsPhotoImageURL = 1 << 1, // if set, a web-based URL is required; asset, image, and imageURL.isFileURL not allowed
  FBSDKShareBridgeOptionsVideoAsset    = 1 << 2,
  FBSDKShareBridgeOptionsVideoData     = 1 << 3,
  FBSDKShareBridgeOptionsWebHashtag    = 1 << 4, // if set, pass the hashtag as a string value, not an array of one string
};

/**
 A base interface for validation of content and media.
 */
@protocol FBSDKSharingValidation

/**
 Asks the receiver to validate that its content or media values are valid.
 - Parameter errorRef: Optional, will receive an FBSDKShareError if the values are not valid.
 - Returns: YES if the receiver's values are valid; otherwise NO
 */
- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef;

@end
