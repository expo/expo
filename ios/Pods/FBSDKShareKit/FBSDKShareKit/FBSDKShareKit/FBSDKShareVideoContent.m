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

#import "FBSDKShareVideoContent.h"

#import <Photos/Photos.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKHashtag.h"
#import "FBSDKShareUtility.h"

#define FBSDK_SHARE_VIDEO_CONTENT_CONTENT_URL_KEY @"contentURL"
#define FBSDK_SHARE_VIDEO_CONTENT_HASHTAG_KEY @"hashtag"
#define FBSDK_SHARE_VIDEO_CONTENT_PEOPLE_IDS_KEY @"peopleIDs"
#define FBSDK_SHARE_VIDEO_CONTENT_PLACE_ID_KEY @"placeID"
#define FBSDK_SHARE_VIDEO_CONTENT_PREVIEW_PHOTO_KEY @"previewPhoto"
#define FBSDK_SHARE_VIDEO_CONTENT_REF_KEY @"ref"
#define FBSDK_SHARE_VIDEO_CONTENT_PAGE_ID_KEY @"pageID"
#define FBSDK_SHARE_VIDEO_CONTENT_VIDEO_KEY @"video"
#define FBSDK_SHARE_VIDEO_CONTENT_UUID_KEY @"uuid"

@implementation FBSDKShareVideoContent

#pragma mark - Properties

@synthesize contentURL = _contentURL;
@synthesize hashtag = _hashtag;
@synthesize peopleIDs = _peopleIDs;
@synthesize placeID = _placeID;
@synthesize ref = _ref;
@synthesize pageID = _pageID;
@synthesize shareUUID = _shareUUID;

#pragma mark - Initializer

- (instancetype)init
{
  self = [super init];
  if (self) {
    _shareUUID = [NSUUID UUID].UUIDString;
  }
  return self;
}

#pragma mark - Setters

- (void)setPeopleIDs:(NSArray *)peopleIDs
{
  [FBSDKShareUtility assertCollection:peopleIDs ofClass:[NSString class] name:@"peopleIDs"];
  if (![FBSDKInternalUtility object:_peopleIDs isEqualToObject:peopleIDs]) {
    _peopleIDs = [peopleIDs copy];
  }
}

#pragma mark - FBSDKSharingContent

- (void)addToParameters:(NSMutableDictionary<NSString *, id> *)parameters
          bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
{
  NSMutableDictionary<NSString *, id> *videoParameters = [[NSMutableDictionary alloc] init];
  if (_video.videoAsset) {
    if (bridgeOptions & FBSDKShareBridgeOptionsVideoAsset) {
      // bridge the PHAsset.localIdentifier
      [FBSDKInternalUtility dictionary:videoParameters
                             setObject:_video.videoAsset.localIdentifier
                                forKey:@"assetIdentifier"];
    } else {
      // bridge the legacy "assets-library" URL from AVAsset
      dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
      PHVideoRequestOptions *options = [[PHVideoRequestOptions alloc] init];
      options.version = PHVideoRequestOptionsVersionCurrent;
      options.deliveryMode = PHVideoRequestOptionsDeliveryModeAutomatic;
      options.networkAccessAllowed = YES;
      [[PHImageManager defaultManager] requestAVAssetForVideo:_video.videoAsset
                                                      options:options
                                                resultHandler:^(AVAsset *avAsset, AVAudioMix *audioMix, NSDictionary<NSString *, id> *info) {
                                                  NSURL *filePathURL = [[(AVURLAsset *)avAsset URL] filePathURL];
                                                  NSString *pathExtension = [filePathURL pathExtension];
                                                  NSString *localIdentifier = [self->_video.videoAsset localIdentifier];
                                                  NSRange range = [localIdentifier rangeOfString:@"/"];
                                                  NSString *uuid = [localIdentifier substringToIndex:range.location];
                                                  NSString *assetPath = [NSString stringWithFormat:@"assets-library://asset/asset.%@?id=%@&ext=%@", pathExtension, uuid, pathExtension];
                                                  if (assetPath) {
                                                    [FBSDKInternalUtility dictionary:videoParameters
                                                                           setObject:[NSURL URLWithString:assetPath]
                                                                              forKey:@"assetURL"];
                                                  }
                                                  dispatch_semaphore_signal(semaphore);
                                                }];
      dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_TIME_NOW, 500 * NSEC_PER_MSEC));
    }
  } else if (_video.data) {
    if (bridgeOptions & FBSDKShareBridgeOptionsVideoData) {
      // bridge the data
      [FBSDKInternalUtility dictionary:videoParameters
                             setObject:_video.data
                                forKey:@"data"];
    }
  } else if (_video.videoURL) {
    if ([[_video.videoURL.scheme lowercaseString] isEqualToString:@"assets-library"]) {
      // bridge the legacy "assets-library" URL
      [FBSDKInternalUtility dictionary:videoParameters
                             setObject:_video.videoURL
                                forKey:@"assetURL"];
    } else if (_video.videoURL.isFileURL) {
      if (bridgeOptions & FBSDKShareBridgeOptionsVideoData) {
        // load the contents of the file and bridge the data
        NSData *data = [NSData dataWithContentsOfURL:_video.videoURL options:NSDataReadingMappedIfSafe error:NULL];
        [FBSDKInternalUtility dictionary:videoParameters
                               setObject:data
                                  forKey:@"data"];
      }
    }
  }
  [FBSDKInternalUtility dictionary:videoParameters
                         setObject:[FBSDKShareUtility convertPhoto:_previewPhoto]
                            forKey:@"previewPhoto"];

  [FBSDKInternalUtility dictionary:parameters
                         setObject:videoParameters
                            forKey:@"video"];
}

#pragma mark - FBSDKSharingValidation

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  if (![FBSDKShareUtility validateRequiredValue:_video name:@"video" error:errorRef]) {
    return NO;
  }
  return [_video validateWithOptions:bridgeOptions error:errorRef];
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [_contentURL hash],
    [_hashtag hash],
    [_peopleIDs hash],
    [_placeID hash],
    [_previewPhoto hash],
    [_ref hash],
    [_pageID hash],
    [_video hash],
    [_shareUUID hash],
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKShareVideoContent class]]) {
    return NO;
  }
  return [self isEqualToShareVideoContent:(FBSDKShareVideoContent *)object];
}

- (BOOL)isEqualToShareVideoContent:(FBSDKShareVideoContent *)content
{
  return (content &&
          [FBSDKInternalUtility object:_contentURL isEqualToObject:content.contentURL] &&
          [FBSDKInternalUtility object:_hashtag isEqualToObject:content.hashtag] &&
          [FBSDKInternalUtility object:_peopleIDs isEqualToObject:content.peopleIDs] &&
          [FBSDKInternalUtility object:_placeID isEqualToObject:content.placeID] &&
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
          [FBSDKInternalUtility object:_previewPhoto isEqualToObject:content.previewPhoto] &&
#pragma clang diagnostic pop
          [FBSDKInternalUtility object:_ref isEqualToObject:content.ref] &&
          [FBSDKInternalUtility object:_pageID isEqualToObject:content.pageID] &&
          [FBSDKInternalUtility object:_shareUUID isEqualToObject:content.shareUUID] &&
          [FBSDKInternalUtility object:_video isEqualToObject:content.video]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _contentURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SHARE_VIDEO_CONTENT_CONTENT_URL_KEY];
    _hashtag = [decoder decodeObjectOfClass:[FBSDKHashtag class] forKey:FBSDK_SHARE_VIDEO_CONTENT_HASHTAG_KEY];
    _peopleIDs = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_SHARE_VIDEO_CONTENT_PEOPLE_IDS_KEY];
    _placeID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_VIDEO_CONTENT_PLACE_ID_KEY];
    _previewPhoto = [decoder decodeObjectOfClass:[FBSDKSharePhoto class]
                                          forKey:FBSDK_SHARE_VIDEO_CONTENT_PREVIEW_PHOTO_KEY];
    _ref = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_VIDEO_CONTENT_REF_KEY];
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_VIDEO_CONTENT_PAGE_ID_KEY];
    _video = [decoder decodeObjectOfClass:[FBSDKShareVideo class] forKey:FBSDK_SHARE_VIDEO_CONTENT_VIDEO_KEY];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_VIDEO_CONTENT_UUID_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_contentURL forKey:FBSDK_SHARE_VIDEO_CONTENT_CONTENT_URL_KEY];
  [encoder encodeObject:_hashtag forKey:FBSDK_SHARE_VIDEO_CONTENT_HASHTAG_KEY];
  [encoder encodeObject:_peopleIDs forKey:FBSDK_SHARE_VIDEO_CONTENT_PEOPLE_IDS_KEY];
  [encoder encodeObject:_placeID forKey:FBSDK_SHARE_VIDEO_CONTENT_PLACE_ID_KEY];
  [encoder encodeObject:_previewPhoto forKey:FBSDK_SHARE_VIDEO_CONTENT_PREVIEW_PHOTO_KEY];
  [encoder encodeObject:_ref forKey:FBSDK_SHARE_VIDEO_CONTENT_REF_KEY];
  [encoder encodeObject:_pageID forKey:FBSDK_SHARE_VIDEO_CONTENT_PAGE_ID_KEY];
  [encoder encodeObject:_video forKey:FBSDK_SHARE_VIDEO_CONTENT_VIDEO_KEY];
  [encoder encodeObject:_shareUUID forKey:FBSDK_SHARE_VIDEO_CONTENT_UUID_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareVideoContent *copy = [[FBSDKShareVideoContent alloc] init];
  copy->_contentURL = [_contentURL copy];
  copy->_hashtag = [_hashtag copy];
  copy->_peopleIDs = [_peopleIDs copy];
  copy->_placeID = [_placeID copy];
  copy->_previewPhoto = [_previewPhoto copy];
  copy->_ref = [_ref copy];
  copy->_pageID = [_pageID copy];
  copy->_video = [_video copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
