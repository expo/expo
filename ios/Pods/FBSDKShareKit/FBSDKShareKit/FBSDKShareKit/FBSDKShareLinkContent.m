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

#import "FBSDKShareLinkContent+Internal.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKHashtag.h"
#import "FBSDKShareUtility.h"

#define FBSDK_SHARE_STATUS_CONTENT_CONTENT_DESCRIPTION_KEY @"contentDescription"
#define FBSDK_SHARE_STATUS_CONTENT_CONTENT_TITLE_KEY @"contentTitle"
#define FBSDK_SHARE_STATUS_CONTENT_CONTENT_URL_KEY @"contentURL"
#define FBSDK_SHARE_STATUS_CONTENT_HASHTAG_KEY @"hashtag"
#define FBSDK_SHARE_STATUS_CONTENT_IMAGE_URL_KEY @"imageURL"
#define FBSDK_SHARE_STATUS_CONTENT_PEOPLE_IDS_KEY @"peopleIDs"
#define FBSDK_SHARE_STATUS_CONTENT_PLACE_ID_KEY @"placeID"
#define FBSDK_SHARE_STATUS_CONTENT_REF_KEY @"ref"
#define FBSDK_SHARE_STATUS_CONTENT_PAGE_ID_KEY @"pageID"
#define FBSDK_SHARE_STATUS_CONTENT_QUOTE_TEXT_KEY @"quote"
#define FBSDK_SHARE_STATUS_CONTENT_FEED_PARAMETERS_KEY @"feedParameters"
#define FBSDK_SHARE_STATUS_CONTENT_UUID_KEY @"uuid"

@implementation FBSDKShareLinkContent

#pragma mark - Properties

@synthesize contentURL = _contentURL;
@synthesize hashtag = _hashtag;
@synthesize peopleIDs = _peopleIDs;
@synthesize placeID = _placeID;
@synthesize ref = _ref;
@synthesize pageID = _pageID;
@synthesize feedParameters = _feedParameters;
@synthesize quote = _quote;
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

- (void)setFeedParameters:(NSDictionary *)feedParameters
{
  if (![_feedParameters isEqualToDictionary:feedParameters]) {
    _feedParameters = [feedParameters copy];
  }
}

#pragma mark - FBSDKSharingContent

- (void)addToParameters:(NSMutableDictionary<NSString *, id> *)parameters
          bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
{
  [FBSDKInternalUtility dictionary:parameters setObject:_contentURL forKey:@"link"];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [FBSDKInternalUtility dictionary:parameters setObject:_contentTitle forKey:@"name"];
  [FBSDKInternalUtility dictionary:parameters setObject:_contentDescription forKey:@"description"];
  [FBSDKInternalUtility dictionary:parameters setObject:_imageURL forKey:@"picture"];
#pragma clang diagnostic pop
  [FBSDKInternalUtility dictionary:parameters setObject:_quote forKey:@"quote"];

  /**
   Pass link parameter as "messenger_link" due to versioning requirements for message dialog flow.
   We will only use the new share flow we developed if messenger_link is present, not link.
   */
  [FBSDKInternalUtility dictionary:parameters setObject:_contentURL forKey:@"messenger_link"];
}

#pragma mark - FBSDKSharingValidation

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  return ([FBSDKShareUtility validateNetworkURL:_contentURL name:@"contentURL" error:errorRef] &&
          [FBSDKShareUtility validateNetworkURL:_imageURL name:@"imageURL" error:errorRef]);
#pragma clang diagnostic pop
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [_contentDescription hash],
    [_contentURL hash],
    [_hashtag hash],
    [_imageURL hash],
    [_peopleIDs hash],
    [_placeID hash],
    [_ref hash],
    [_pageID hash],
    [_contentTitle hash],
    [_feedParameters hash],
    [_quote hash],
    [_shareUUID hash],
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKShareLinkContent class]]) {
    return NO;
  }
  return [self isEqualToShareLinkContent:(FBSDKShareLinkContent *)object];
}

- (BOOL)isEqualToShareLinkContent:(FBSDKShareLinkContent *)content
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  return (content &&
          [FBSDKInternalUtility object:_contentDescription isEqualToObject:content.contentDescription] &&
          [FBSDKInternalUtility object:_contentTitle isEqualToObject:content.contentTitle] &&
          [FBSDKInternalUtility object:_contentURL isEqualToObject:content.contentURL] &&
          [FBSDKInternalUtility object:_hashtag isEqualToObject:content.hashtag] &&
          [FBSDKInternalUtility object:_feedParameters isEqualToObject:content.feedParameters] &&
          [FBSDKInternalUtility object:_imageURL isEqualToObject:content.imageURL] &&
          [FBSDKInternalUtility object:_peopleIDs isEqualToObject:content.peopleIDs] &&
          [FBSDKInternalUtility object:_placeID isEqualToObject:content.placeID] &&
          [FBSDKInternalUtility object:_ref isEqualToObject:content.ref] &&
          [FBSDKInternalUtility object:_pageID isEqualToObject:content.pageID] &&
          [FBSDKInternalUtility object:_shareUUID isEqualToObject:content.shareUUID]) &&
          [FBSDKInternalUtility object:_quote isEqualToObject:content.quote];
#pragma clang diagnostic pop
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _contentDescription = [decoder decodeObjectOfClass:[NSString class]
                                                forKey:FBSDK_SHARE_STATUS_CONTENT_CONTENT_DESCRIPTION_KEY];
    _contentTitle = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_STATUS_CONTENT_CONTENT_TITLE_KEY];
    _contentURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SHARE_STATUS_CONTENT_CONTENT_URL_KEY];
    _feedParameters = [decoder decodeObjectOfClass:[NSDictionary class] forKey:FBSDK_SHARE_STATUS_CONTENT_FEED_PARAMETERS_KEY];
    _hashtag = [decoder decodeObjectOfClass:[FBSDKHashtag class] forKey:FBSDK_SHARE_STATUS_CONTENT_HASHTAG_KEY];
    _imageURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SHARE_STATUS_CONTENT_IMAGE_URL_KEY];
    _peopleIDs = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_SHARE_STATUS_CONTENT_PEOPLE_IDS_KEY];
    _placeID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_STATUS_CONTENT_PLACE_ID_KEY];
    _ref = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_STATUS_CONTENT_REF_KEY];
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_STATUS_CONTENT_PAGE_ID_KEY];
    _quote = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_STATUS_CONTENT_QUOTE_TEXT_KEY];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_STATUS_CONTENT_UUID_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_contentDescription forKey:FBSDK_SHARE_STATUS_CONTENT_CONTENT_DESCRIPTION_KEY];
  [encoder encodeObject:_contentTitle forKey:FBSDK_SHARE_STATUS_CONTENT_CONTENT_TITLE_KEY];
  [encoder encodeObject:_contentURL forKey:FBSDK_SHARE_STATUS_CONTENT_CONTENT_URL_KEY];
  [encoder encodeObject:_feedParameters forKey:FBSDK_SHARE_STATUS_CONTENT_FEED_PARAMETERS_KEY];
  [encoder encodeObject:_hashtag forKey:FBSDK_SHARE_STATUS_CONTENT_HASHTAG_KEY];
  [encoder encodeObject:_imageURL forKey:FBSDK_SHARE_STATUS_CONTENT_IMAGE_URL_KEY];
  [encoder encodeObject:_peopleIDs forKey:FBSDK_SHARE_STATUS_CONTENT_PEOPLE_IDS_KEY];
  [encoder encodeObject:_placeID forKey:FBSDK_SHARE_STATUS_CONTENT_PLACE_ID_KEY];
  [encoder encodeObject:_ref forKey:FBSDK_SHARE_STATUS_CONTENT_REF_KEY];
  [encoder encodeObject:_pageID forKey:FBSDK_SHARE_STATUS_CONTENT_PAGE_ID_KEY];
  [encoder encodeObject:_quote forKey:FBSDK_SHARE_STATUS_CONTENT_QUOTE_TEXT_KEY];
  [encoder encodeObject:_shareUUID forKey:FBSDK_SHARE_STATUS_CONTENT_UUID_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareLinkContent *copy = [[FBSDKShareLinkContent alloc] init];
  copy->_contentDescription = [_contentDescription copy];
  copy->_contentTitle = [_contentTitle copy];
  copy->_contentURL = [_contentURL copy];
  copy->_feedParameters = [_feedParameters copy];
  copy->_hashtag = [_hashtag copy];
  copy->_imageURL = [_imageURL copy];
  copy->_peopleIDs = [_peopleIDs copy];
  copy->_placeID = [_placeID copy];
  copy->_ref = [_ref copy];
  copy->_pageID = [_pageID copy];
  copy->_quote = [_quote copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
