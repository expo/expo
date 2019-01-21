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

#import "FBSDKShareMediaContent.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKHashtag.h"
#import "FBSDKShareConstants.h"
#import "FBSDKSharePhoto.h"
#import "FBSDKShareUtility.h"
#import "FBSDKShareVideo.h"

#define FBSDK_SHARE_MEDIA_CONTENT_CONTENT_URL_KEY @"contentURL"
#define FBSDK_SHARE_MEDIA_CONTENT_HASHTAG_KEY @"hashtag"
#define FBSDK_SHARE_MEDIA_CONTENT_PEOPLE_IDS_KEY @"peopleIDs"
#define FBSDK_SHARE_MEDIA_CONTENT_MEDIA_KEY @"media"
#define FBSDK_SHARE_MEDIA_CONTENT_PLACE_ID_KEY @"placeID"
#define FBSDK_SHARE_MEDIA_CONTENT_REF_KEY @"ref"
#define FBSDK_SHARE_MEDIA_CONTENT_PAGE_ID_KEY @"pageID"
#define FBSDK_SHARE_MEDIA_CONTENT_UUID_KEY @"uuid"

@implementation FBSDKShareMediaContent

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

- (void)setMedia:(NSArray *)media
{
  [FBSDKShareUtility assertCollection:media ofClassStrings:@[NSStringFromClass([FBSDKSharePhoto class]), NSStringFromClass([FBSDKShareVideo class])] name:@"media"];
  if (![FBSDKInternalUtility object:_media isEqualToObject:media]) {
    _media = [media copy];
  }
}

#pragma mark - FBSDKSharingContent

- (void)addToParameters:(NSMutableDictionary<NSString *, id> *)parameters
          bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
{
  // FBSDKShareMediaContent is currently available via the Share extension only (thus no parameterization implemented at this time)
}

- (NSDictionary<NSString *, id> *)addParameters:(NSDictionary<NSString *, id> *)existingParameters
                                  bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
{
  // FBSDKShareMediaContent is currently available via the Share extension only (thus no parameterization implemented at this time)
  return existingParameters;
}

#pragma mark - FBSDKSharingValidation

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  if (![FBSDKShareUtility validateArray:_media minCount:1 maxCount:20 name:@"photos" error:errorRef]) {
    return NO;
  }
  int videoCount = 0;
  for (id media in _media) {
    if ([media isKindOfClass:[FBSDKSharePhoto class]]) {
      FBSDKSharePhoto *photo = (FBSDKSharePhoto *)media;
      if (![photo validateWithOptions:bridgeOptions error:NULL]) {
        if (errorRef != NULL) {
          *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                           name:@"media"
                                                          value:media
                                                        message:@"photos must have UIImages"];
        }
        return NO;
      }
    } else if ([media isKindOfClass:[FBSDKShareVideo class]]) {
      if (videoCount > 0) {
        if (errorRef != NULL) {
          *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                           name:@"media"
                                                          value:media
                                                        message:@"Only 1 video is allowed"];
          return NO;
        }
      }
      videoCount++;
      FBSDKShareVideo *video = (FBSDKShareVideo *)media;
      if (![FBSDKShareUtility validateRequiredValue:video name:@"video" error:errorRef]) {
        return NO;
      }
      if (![video validateWithOptions:bridgeOptions error:errorRef]) {
        return NO;
      }

    } else {
      if (errorRef != NULL) {
        *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                         name:@"media"
                                                        value:media
                                                      message:@"Only FBSDKSharePhoto and FBSDKShareVideo are allowed in `media` property"];
      }
      return NO;
    }
  }
  return YES;
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    _contentURL.hash,
    _hashtag.hash,
    _peopleIDs.hash,
    _media.hash,
    _placeID.hash,
    _ref.hash,
    _pageID.hash,
    _shareUUID.hash,
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKShareMediaContent class]]) {
    return NO;
  }
  return [self isEqualToShareMediaContent:(FBSDKShareMediaContent *)object];
}

- (BOOL)isEqualToShareMediaContent:(FBSDKShareMediaContent *)content
{
  return (content &&
          [FBSDKInternalUtility object:_contentURL isEqualToObject:content.contentURL] &&
          [FBSDKInternalUtility object:_hashtag isEqualToObject:content.hashtag] &&
          [FBSDKInternalUtility object:_peopleIDs isEqualToObject:content.peopleIDs] &&
          [FBSDKInternalUtility object:_media isEqualToObject:content.media] &&
          [FBSDKInternalUtility object:_placeID isEqualToObject:content.placeID] &&
          [FBSDKInternalUtility object:_ref isEqualToObject:content.ref] &&
          [FBSDKInternalUtility object:_shareUUID isEqualToObject:content.shareUUID] &&
          [FBSDKInternalUtility object:_pageID isEqualToObject:content.pageID]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _contentURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SHARE_MEDIA_CONTENT_CONTENT_URL_KEY];
    _hashtag = [decoder decodeObjectOfClass:[FBSDKHashtag class] forKey:FBSDK_SHARE_MEDIA_CONTENT_HASHTAG_KEY];
    _peopleIDs = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_SHARE_MEDIA_CONTENT_PEOPLE_IDS_KEY];
    NSSet *classes = [NSSet setWithObjects:[NSArray class], [FBSDKSharePhoto class], nil];
    _media = [decoder decodeObjectOfClasses:classes forKey:FBSDK_SHARE_MEDIA_CONTENT_MEDIA_KEY];
    _placeID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_MEDIA_CONTENT_PLACE_ID_KEY];
    _ref = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_MEDIA_CONTENT_REF_KEY];
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_MEDIA_CONTENT_PAGE_ID_KEY];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_MEDIA_CONTENT_UUID_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_contentURL forKey:FBSDK_SHARE_MEDIA_CONTENT_CONTENT_URL_KEY];
  [encoder encodeObject:_hashtag forKey:FBSDK_SHARE_MEDIA_CONTENT_HASHTAG_KEY];
  [encoder encodeObject:_peopleIDs forKey:FBSDK_SHARE_MEDIA_CONTENT_PEOPLE_IDS_KEY];
  [encoder encodeObject:_media forKey:FBSDK_SHARE_MEDIA_CONTENT_MEDIA_KEY];
  [encoder encodeObject:_placeID forKey:FBSDK_SHARE_MEDIA_CONTENT_PLACE_ID_KEY];
  [encoder encodeObject:_ref forKey:FBSDK_SHARE_MEDIA_CONTENT_REF_KEY];
  [encoder encodeObject:_pageID forKey:FBSDK_SHARE_MEDIA_CONTENT_PAGE_ID_KEY];
  [encoder encodeObject:_shareUUID forKey:FBSDK_SHARE_MEDIA_CONTENT_UUID_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareMediaContent *copy = [[FBSDKShareMediaContent alloc] init];
  copy->_contentURL = [_contentURL copy];
  copy->_hashtag = [_hashtag copy];
  copy->_peopleIDs = [_peopleIDs copy];
  copy->_media = [_media copy];
  copy->_placeID = [_placeID copy];
  copy->_ref = [_ref copy];
  copy->_pageID = [_pageID copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
