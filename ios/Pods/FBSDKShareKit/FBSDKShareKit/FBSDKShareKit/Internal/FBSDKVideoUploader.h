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

#import <FBSDKCoreKit/FBSDKCoreKit.h>

#import <FBSDKShareKit/FBSDKShareVideo.h>
#import <FBSDKShareKit/FBSDKSharing.h>

@protocol FBSDKVideoUploaderDelegate;

/**
  A utility class for uploading through the chunk upload graph API.  Using this class requires an access token in
 `[FBSDKAccessToken currentAccessToken]` that has been granted the "publish_actions" permission.

 see https://developers.facebook.com/docs/graph-api/video-uploads
 */
@interface FBSDKVideoUploader : NSObject

/**
  Initialize videoUploader
 @param videoName The file name of the video to be uploaded
 @param videoSize The size of the video to be uploaded
 @param parameters Optional parameters for video uploads. See Graph API documentation for the full list of parameters https://developers.facebook.com/docs/graph-api/reference/video
 @param delegate Receiver's delegate
 */
- (instancetype)initWithVideoName:(NSString *)videoName videoSize:(NSUInteger)videoSize parameters:(NSDictionary *)parameters delegate:(id<FBSDKVideoUploaderDelegate>)delegate
NS_DESIGNATED_INITIALIZER;


/**
  The video to be uploaded.
 */
@property (readonly, copy, nonatomic) FBSDKShareVideo *video;

/**
  Optional parameters for video uploads. See Graph API documentation for the full list of parameters https://developers.facebook.com/docs/graph-api/reference/video
 */
@property (copy, nonatomic) NSDictionary *parameters;

/**
  The graph node to which video should be uploaded
 */
@property (nonatomic, copy) NSString *graphNode;

/**
  Receiver's delegate
 */
@property (weak, nonatomic) id<FBSDKVideoUploaderDelegate> delegate;

/**
  Start upload process
 */
//TODO #6229672 add cancel and/or pause
- (void)start;

@end

/**
  A delegate for `FBSDKVideoUploader`.

 The delegate passes video chunk to `FBSDKVideoUploader` object in `NSData` format and is notified with the results of the uploader.
 */
@protocol FBSDKVideoUploaderDelegate <NSObject>

/**
  get chunk of the video to be uploaded in 'NSData' format
 @param videoUploader The `FBSDKVideoUploader` object which is performing the upload process
 @param startOffset The start offset of video chunk to be uploaded
 @param endOffset The end offset of video chunk being to be uploaded
 */
- (NSData *)videoChunkDataForVideoUploader:(FBSDKVideoUploader *)videoUploader startOffset:(NSUInteger) startOffset endOffset:(NSUInteger) endOffset;

/**
  Notify the delegate that upload process success.
 @param videoUploader The `FBSDKVideoUploader` object which is performing the upload process
 @param results The result from successful upload
 */
- (void)videoUploader:(FBSDKVideoUploader *)videoUploader didCompleteWithResults:(NSDictionary *)results;

/**
  Notify the delegate that upload process fails.
 @param videoUploader The `FBSDKVideoUploader` object which is performing the upload process
 @param error The error object from unsuccessful upload
 */
- (void)videoUploader:(FBSDKVideoUploader *)videoUploader didFailWithError:(NSError *)error;

@end
