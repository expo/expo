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

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareConstants.h"
#import "FBSDKSharePhoto.h"
#import "FBSDKShareUtility.h"

NSString *const kFBSDKShareVideoAssetKey = @"videoAsset";
NSString *const kFBSDKShareVideoDataKey = @"data";
NSString *const kFBSDKShareVideoPreviewPhotoKey = @"previewPhoto";
NSString *const kFBSDKShareVideoURLKey = @"videoURL";

@implementation FBSDKShareVideo

#pragma mark - Class Methods

+ (instancetype)videoWithData:(NSData *)data
{
  FBSDKShareVideo *video = [[FBSDKShareVideo alloc] init];
  video.data = data;
  return video;
}

+ (instancetype)videoWithData:(NSData *)data previewPhoto:(FBSDKSharePhoto *)previewPhoto
{
  FBSDKShareVideo *video = [[FBSDKShareVideo alloc] init];
  video.data = data;
  video.previewPhoto = previewPhoto;
  return video;
}

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

- (void)setData:(NSData *)data
{
  _data = data;
  _videoAsset = nil;
  _videoURL = nil;
  _previewPhoto = nil;
}

- (void)setVideoAsset:(PHAsset *)videoAsset
{
  _data = nil;
  _videoAsset = [videoAsset copy];
  _videoURL = nil;
  _previewPhoto = nil;
}

- (void)setVideoURL:(NSURL *)videoURL
{
  _data = nil;
  _videoAsset = nil;
  _videoURL = [videoURL copy];
  _previewPhoto = nil;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    _data.hash,
    _videoAsset.hash,
    _videoURL.hash,
    _previewPhoto.hash,
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
          [FBSDKInternalUtility object:_data isEqualToObject:video.data] &&
          [FBSDKInternalUtility object:_videoAsset isEqualToObject:video.videoAsset] &&
          [FBSDKInternalUtility object:_videoURL isEqualToObject:video.videoURL] &&
          [FBSDKInternalUtility object:_previewPhoto isEqualToObject:video.previewPhoto]);
}

#pragma mark - FBSDKSharingValidation

- (BOOL)_validateData:(NSData *)data
          withOptions:(FBSDKShareBridgeOptions)bridgeOptions
                error:(NSError *__autoreleasing *)errorRef
{
  if (data) {
    if (bridgeOptions & FBSDKShareBridgeOptionsVideoData) {
      return YES; // will bridge the data
    }
  }
  if ((errorRef != NULL) && !*errorRef) {
    *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                     name:@"data"
                                                    value:data
                                                  message:@"Cannot share video data."];
  }
  return NO;
}

- (BOOL)_validateVideoAsset:(PHAsset *)videoAsset
                withOptions:(FBSDKShareBridgeOptions)bridgeOptions
                      error:(NSError *__autoreleasing *)errorRef
{
  if (videoAsset) {
    if (PHAssetMediaTypeVideo == videoAsset.mediaType) {
      if (bridgeOptions & FBSDKShareBridgeOptionsVideoAsset) {
        return YES; // will bridge the PHAsset.localIdentifier
      } else {
        return YES; // will bridge the legacy "assets-library" URL from AVAsset
      }
    } else {
      if (errorRef != NULL) {
        *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                         name:@"videoAsset"
                                                        value:videoAsset
                                                      message:@"Must refer to a video file."];
      }
      return NO;
    }
  }
  return NO;
}

- (BOOL)_validateVideoURL:(NSURL *)videoURL
              withOptions:(FBSDKShareBridgeOptions)bridgeOptions
                    error:(NSError *__autoreleasing *)errorRef
{
  if (videoURL) {
    if ([videoURL.scheme.lowercaseString isEqualToString:@"assets-library"]) {
      return YES; // will bridge the legacy "assets-library" URL
    } else if (videoURL.isFileURL) {
      if (bridgeOptions & FBSDKShareBridgeOptionsVideoData) {
        return YES; // will load the contents of the file and bridge the data
      }
    }
  }
  if ((errorRef != NULL) && !*errorRef) {
    *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                     name:@"videoURL"
                                                    value:videoURL
                                                  message:@"Must refer to an asset file."];
  }
  return NO;
}

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  // validate that a valid asset, data, or videoURL value has been set.
  // don't validate the preview photo; if it isn't valid it'll be dropped from the share; a default one may be created if needed.
  if (_videoAsset) {
    return [self _validateVideoAsset:_videoAsset withOptions:bridgeOptions error:errorRef];
  } else if (_data) {
    return [self _validateData:_data withOptions:bridgeOptions error:errorRef];
  } else if (_videoURL) {
    return [self _validateVideoURL:_videoURL withOptions:bridgeOptions error:errorRef];
  } else {
    if ((errorRef != NULL) && !*errorRef) {
      *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                       name:@"video"
                                                      value:self
                                                    message:@"Must have an asset, data, or videoURL value."];
    }
    return NO;
  }
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _data = [decoder decodeObjectOfClass:[NSData class] forKey:kFBSDKShareVideoDataKey];
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
  [encoder encodeObject:_data forKey:kFBSDKShareVideoDataKey];
  [encoder encodeObject:_videoAsset.localIdentifier forKey:kFBSDKShareVideoAssetKey];
  [encoder encodeObject:_videoURL forKey:kFBSDKShareVideoURLKey];
  [encoder encodeObject:_previewPhoto forKey:kFBSDKShareVideoPreviewPhotoKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareVideo *copy = [[FBSDKShareVideo alloc] init];
  copy->_data = [_data copy];
  copy->_videoAsset = [_videoAsset copy];
  copy->_videoURL = [_videoURL copy];
  copy->_previewPhoto = [_previewPhoto copy];
  return copy;
}

@end

@implementation PHAsset (FBSDKShareVideo)

- (NSURL *)videoURL
{
  __block NSURL *videoURL = nil;
  // obtain the legacy "assets-library" URL from AVAsset
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  PHVideoRequestOptions *const options = [PHVideoRequestOptions new];
  options.version = PHVideoRequestOptionsVersionCurrent;
  options.deliveryMode = PHVideoRequestOptionsDeliveryModeAutomatic;
  options.networkAccessAllowed = YES;
  [[PHImageManager defaultManager] requestAVAssetForVideo:self
                                                  options:options
                                            resultHandler:^(AVAsset *avAsset, AVAudioMix *audioMix, NSDictionary<NSString *, id> *info) {
                                              NSURL *const filePathURL = ((AVURLAsset *)avAsset).URL.filePathURL;
                                              NSString *const pathExtension = filePathURL.pathExtension;
                                              NSString *const localIdentifier = self.localIdentifier;
                                              const NSRange range = [localIdentifier rangeOfString:@"/"];
                                              NSString *const uuid = [localIdentifier substringToIndex:range.location];
                                              NSString *const assetPath = [NSString stringWithFormat:@"assets-library://asset/asset.%@?id=%@&ext=%@",
                                                                           pathExtension,
                                                                           uuid,
                                                                           pathExtension];
                                              videoURL = [NSURL URLWithString:assetPath];
                                              dispatch_semaphore_signal(semaphore);
                                            }];
  dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, 500 * NSEC_PER_MSEC));
  return videoURL;
}

@end
