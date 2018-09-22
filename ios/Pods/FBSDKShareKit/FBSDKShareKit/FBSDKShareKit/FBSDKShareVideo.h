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

#import <UIKit/UIKit.h>

#import <FBSDKCoreKit/FBSDKCopying.h>

@class FBSDKSharePhoto;
@class PHAsset;

/**
  A video for sharing.
 */
@interface FBSDKShareVideo : NSObject <FBSDKCopying, NSSecureCoding>

/**
 Convenience method to build a new video object with a PHAsset.
 - Parameter videoAsset: The PHAsset that represents the video in the Photos library.
 */
+ (instancetype)videoWithVideoAsset:(PHAsset *)videoAsset;

/**
 Convenience method to build a new video object with a PHAsset and a previewPhoto.
 - Parameter videoAsset: The PHAsset that represents the video in the Photos library.
 - Parameter previewPhoto: The photo that represents the video.
 */
+ (instancetype)videoWithVideoAsset:(PHAsset *)videoAsset previewPhoto:(FBSDKSharePhoto *)previewPhoto;

/**
  Convenience method to build a new video object with a videoURL.
 - Parameter videoURL: The URL to the video.
 */
+ (instancetype)videoWithVideoURL:(NSURL *)videoURL;

/**
  Convenience method to build a new video object with a videoURL and a previewPhoto.
 - Parameter videoURL: The URL to the video.
 - Parameter previewPhoto: The photo that represents the video.
 */
+ (instancetype)videoWithVideoURL:(NSURL *)videoURL previewPhoto:(FBSDKSharePhoto *)previewPhoto;

/**
 The representation of the video in the Photos library.
 - Returns: PHAsset that represents the video in the Photos library.
 */
@property (nonatomic, copy) PHAsset *videoAsset;

/**
  The file URL to the video.
 - Returns: URL that points to the location of the video on disk
 */
@property (nonatomic, copy) NSURL *videoURL;

/**
  The photo that represents the video.
 - Returns: The photo
 */
@property (nonatomic, copy) FBSDKSharePhoto *previewPhoto;

/**
  Compares the receiver to another video.
 - Parameter video: The other video
 - Returns: YES if the receiver's values are equal to the other video's values; otherwise NO
 */
- (BOOL)isEqualToShareVideo:(FBSDKShareVideo *)video;

@end
