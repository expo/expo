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

#import "FBSDKShareVideo.h"

#import <Photos/Photos.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKSharePhoto.h"

NSString *const kFBSDKShareVideoAssetKey = @"videoAsset";
NSString *const kFBSDKShareVideoPreviewPhotoKey = @"previewPhoto";
NSString *const kFBSDKShareVideoURLKey = @"videoURL";

@implementation FBSDKShareVideo

#pragma mark - Class Methods

+ (instancetype)videoWithVideoAsset:(PHAsset *)videoAsset
{
  FBSDKShareVideo *video = [[FBSDKShareVideo alloc] init];
  video.videoAsset = videoAsset;
  return video;
}

+ (instancetype)videoWithVideoAsset:(PHAsset *)videoAsset previewPhoto:(FBSDKSharePhoto *)previewPhoto
{
  FBSDKShareVideo *video = [[FBSDKShareVideo alloc] init];
  video.videoAsset = videoAsset;
  video.previewPhoto = previewPhoto;
  return video;
}

+ (instancetype)videoWithVideoURL:(NSURL *)videoURL
{
  FBSDKShareVideo *video = [[FBSDKShareVideo alloc] init];
  video.videoURL = videoURL;
  return video;
}

+ (instancetype)videoWithVideoURL:(NSURL *)videoURL previewPhoto:(FBSDKSharePhoto *)previewPhoto
{
  FBSDKShareVideo *video = [[FBSDKShareVideo alloc] init];
  video.videoURL = videoURL;
  video.previewPhoto = previewPhoto;
  return video;
}

#pragma mark - Properties

- (void)setVideoAsset:(PHAsset *)videoAsset
{
  _videoAsset = [videoAsset copy];
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  PHVideoRequestOptions *options = [[PHVideoRequestOptions alloc]init];
  options.version = PHVideoRequestOptionsVersionCurrent;
  options.deliveryMode = PHVideoRequestOptionsDeliveryModeAutomatic;
  options.networkAccessAllowed = YES;
  [[PHImageManager defaultManager] requestAVAssetForVideo:videoAsset
                                                  options:options
                                            resultHandler:^(AVAsset *avAsset, AVAudioMix *audioMix, NSDictionary<NSString *, id> *info) {
    NSURL *filePathURL = [[(AVURLAsset *)avAsset URL] filePathURL];
    NSString *pathExtension = [filePathURL pathExtension];
    NSString *localIdentifier = [videoAsset localIdentifier];
    NSRange range = [localIdentifier rangeOfString:@"/"];
    NSString *uuid = [localIdentifier substringToIndex:range.location];
    NSString *assetPath = [NSString stringWithFormat:@"assets-library://asset/asset.%@?id=%@&ext=%@", pathExtension, uuid, pathExtension];
    _videoURL = [NSURL URLWithString:assetPath];
    dispatch_semaphore_signal(semaphore);
  }];
  dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, 500 * NSEC_PER_MSEC));
}

- (void)setVideoURL:(NSURL *)videoURL
{
  _videoAsset = nil;
  _videoURL = [videoURL copy];
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [_videoAsset hash],
    [_videoURL hash],
    [_previewPhoto hash],
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKShareVideo class]]) {
    return NO;
  }
  return [self isEqualToShareVideo:(FBSDKShareVideo *)object];
}

- (BOOL)isEqualToShareVideo:(FBSDKShareVideo *)video
{
  return (video &&
          [FBSDKInternalUtility object:_videoAsset isEqualToObject:video.videoAsset] &&
          [FBSDKInternalUtility object:_videoURL isEqualToObject:video.videoURL] &&
          [FBSDKInternalUtility object:_previewPhoto isEqualToObject:video.previewPhoto]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    NSString *localIdentifier = [decoder decodeObjectOfClass:[NSString class] forKey:kFBSDKShareVideoAssetKey];
    if (localIdentifier && (PHAuthorizationStatusAuthorized == [PHPhotoLibrary authorizationStatus])) {
      _videoAsset = [PHAsset fetchAssetsWithLocalIdentifiers:@[localIdentifier] options:nil].firstObject;
    }
    _videoURL = [decoder decodeObjectOfClass:[NSURL class] forKey:kFBSDKShareVideoURLKey];
    _previewPhoto = [decoder decodeObjectOfClass:[FBSDKSharePhoto class] forKey:kFBSDKShareVideoPreviewPhotoKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_videoAsset.localIdentifier forKey:kFBSDKShareVideoAssetKey];
  [encoder encodeObject:_videoURL forKey:kFBSDKShareVideoURLKey];
  [encoder encodeObject:_previewPhoto forKey:kFBSDKShareVideoPreviewPhotoKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareVideo *copy = [[FBSDKShareVideo alloc] init];
  copy->_videoAsset = [_videoAsset copy];
  copy->_videoURL = [_videoURL copy];
  copy->_previewPhoto = [_previewPhoto copy];
  return copy;
}

@end
