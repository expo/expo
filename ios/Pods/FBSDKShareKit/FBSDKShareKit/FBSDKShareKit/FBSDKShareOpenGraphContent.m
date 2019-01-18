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

#import "FBSDKShareOpenGraphContent.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKHashtag.h"
#import "FBSDKSharePhoto.h"
#import "FBSDKShareUtility.h"

#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_ACTION_KEY @"action"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_CONTENT_URL_KEY @"contentURL"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_HASHTAG_KEY @"hashtag"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_PEOPLE_IDS_KEY @"peopleIDs"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_PLACE_ID_KEY @"placeID"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_PREVIEW_PROPERTY_NAME_KEY @"previewPropertyName"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_REF_KEY @"ref"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_PAGE_ID_KEY @"pageID"
#define FBSDK_SHARE_OPEN_GRAPH_CONTENT_UUID_KEY @"uuid"

@implementation FBSDKShareOpenGraphContent

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
  [parameters addEntriesFromDictionary:[self addParameters:parameters bridgeOptions:bridgeOptions]];
}

- (NSDictionary<NSString *, id> *)addParameters:(NSDictionary<NSString *, id> *)existingParameters
                                  bridgeOptions:(FBSDKShareBridgeOptions)bridgeOptions
{
  NSMutableDictionary<NSString *, id> *updatedParameters = [NSMutableDictionary dictionaryWithDictionary:existingParameters];

  NSString *previewPropertyName = [FBSDKShareUtility getOpenGraphNameAndNamespaceFromFullName:_previewPropertyName namespace:nil];
  [FBSDKInternalUtility dictionary:updatedParameters
                         setObject:previewPropertyName
                            forKey:@"previewPropertyName"];
  [FBSDKInternalUtility dictionary:updatedParameters setObject:_action.actionType forKey:@"actionType"];
  [FBSDKInternalUtility dictionary:updatedParameters
                         setObject:[FBSDKShareUtility convertOpenGraphValueContainer:_action requireNamespace:NO]
                            forKey:@"action"];

  return updatedParameters;
}

#pragma mark - FBSDKSharingValidation

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  return ([FBSDKShareUtility validateRequiredValue:_action name:@"action" error:errorRef] &&
          [FBSDKShareUtility validateRequiredValue:_previewPropertyName name:@"previewPropertyName" error:errorRef] &&
          [FBSDKShareUtility validateRequiredValue:_action[_previewPropertyName] name:_previewPropertyName error:errorRef]);
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    _action.hash,
    _contentURL.hash,
    _hashtag.hash,
    _peopleIDs.hash,
    _placeID.hash,
    _previewPropertyName.hash,
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
  if (![object isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    return NO;
  }
  return [self isEqualToShareOpenGraphContent:(FBSDKShareOpenGraphContent *)object];
}

- (BOOL)isEqualToShareOpenGraphContent:(FBSDKShareOpenGraphContent *)content
{
  return (content &&
          [FBSDKInternalUtility object:_action isEqualToObject:content.action] &&
          [FBSDKInternalUtility object:_contentURL isEqualToObject:content.contentURL] &&
          [FBSDKInternalUtility object:_hashtag isEqualToObject:content.hashtag] &&
          [FBSDKInternalUtility object:_peopleIDs isEqualToObject:content.peopleIDs] &&
          [FBSDKInternalUtility object:_placeID isEqualToObject:content.placeID] &&
          [FBSDKInternalUtility object:_previewPropertyName isEqualToObject:content.previewPropertyName] &&
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
  if ((self = [super init])) {
    _action = [decoder decodeObjectOfClass:[FBSDKShareOpenGraphAction class]
                                    forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_ACTION_KEY];
    _contentURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_CONTENT_URL_KEY];
    _hashtag = [decoder decodeObjectOfClass:[FBSDKHashtag class] forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_HASHTAG_KEY];
    _peopleIDs = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PEOPLE_IDS_KEY];
    _placeID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PLACE_ID_KEY];
    _previewPropertyName = [decoder decodeObjectOfClass:[NSString class]
                                                 forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PREVIEW_PROPERTY_NAME_KEY];
    _ref = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_REF_KEY];
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PAGE_ID_KEY];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_UUID_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_action forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_ACTION_KEY];
  [encoder encodeObject:_contentURL forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_CONTENT_URL_KEY];
  [encoder encodeObject:_hashtag forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_HASHTAG_KEY];
  [encoder encodeObject:_peopleIDs forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PEOPLE_IDS_KEY];
  [encoder encodeObject:_placeID forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PLACE_ID_KEY];
  [encoder encodeObject:_previewPropertyName forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PREVIEW_PROPERTY_NAME_KEY];
  [encoder encodeObject:_ref forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_REF_KEY];
  [encoder encodeObject:_pageID forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_PAGE_ID_KEY];
  [encoder encodeObject:_shareUUID forKey:FBSDK_SHARE_OPEN_GRAPH_CONTENT_UUID_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareOpenGraphContent *copy = [[FBSDKShareOpenGraphContent alloc] init];
  copy->_action = [_action copy];
  copy->_contentURL = [_contentURL copy];
  copy->_hashtag = [_hashtag copy];
  copy->_peopleIDs = [_peopleIDs copy];
  copy->_placeID = [_placeID copy];
  copy->_previewPropertyName = [_previewPropertyName copy];
  copy->_ref = [_ref copy];
  copy->_pageID = [_pageID copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
