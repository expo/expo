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

#import "FBSDKShareCameraEffectContent.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKHashtag.h"
#import "FBSDKShareUtility.h"

static NSString *const FBSDKShareCameraEffectContentEffectIDKey = @"effectID";
static NSString *const FBSDKShareCameraEffectContentEffectArgumentsKey = @"effectArguments";
static NSString *const FBSDKShareCameraEffectContentEffectTexturesKey = @"effectTextures";
static NSString *const FBSDKShareCameraEffectContentContentURLKey = @"contentURL";
static NSString *const FBSDKShareCameraEffectContentHashtagKey = @"hashtag";
static NSString *const FBSDKShareCameraEffectContentPeopleIDsKey = @"peopleIDs";
static NSString *const FBSDKShareCameraEffectContentPlaceIDKey = @"placeID";
static NSString *const FBSDKShareCameraEffectContentRefKey = @"ref";
static NSString *const FBSDKShareCameraEffectContentPageIDKey = @"pageID";
static NSString *const FBSDKShareCameraEffectContentUUIDKey = @"uuid";

@implementation FBSDKShareCameraEffectContent

#pragma mark - Properties

@synthesize effectID = _effectID;
@synthesize effectArguments = _effectArguments;
@synthesize effectTextures = _effectTextures;
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

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [_effectID hash],
    [_effectArguments hash],
    [_effectTextures hash],
    [_contentURL hash],
    [_hashtag hash],
    [_peopleIDs hash],
    [_placeID hash],
    [_ref hash],
    [_pageID hash],
    [_shareUUID hash],
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    return NO;
  }
  return [self isEqualToShareCameraEffectContent:(FBSDKShareCameraEffectContent *)object];
}

- (BOOL)isEqualToShareCameraEffectContent:(FBSDKShareCameraEffectContent *)content
{
  return (content &&
          [FBSDKInternalUtility object:_effectID isEqualToObject:content.effectID] &&
          [FBSDKInternalUtility object:_effectArguments isEqualToObject:content.effectArguments] &&
          [FBSDKInternalUtility object:_effectTextures isEqualToObject:content.effectTextures] &&
          [FBSDKInternalUtility object:_contentURL isEqualToObject:content.contentURL] &&
          [FBSDKInternalUtility object:_hashtag isEqualToObject:content.hashtag] &&
          [FBSDKInternalUtility object:_peopleIDs isEqualToObject:content.peopleIDs] &&
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

- (id)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _effectID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKShareCameraEffectContentEffectIDKey];
    _effectArguments = [decoder decodeObjectOfClass:[FBSDKCameraEffectArguments class] forKey:FBSDKShareCameraEffectContentEffectArgumentsKey];
    _effectTextures = [decoder decodeObjectOfClass:[FBSDKCameraEffectTextures class] forKey:FBSDKShareCameraEffectContentEffectTexturesKey];
    _contentURL = [decoder decodeObjectOfClass:[NSURL class] forKey:FBSDKShareCameraEffectContentContentURLKey];
    _hashtag = [decoder decodeObjectOfClass:[FBSDKHashtag class] forKey:FBSDKShareCameraEffectContentHashtagKey];
    _peopleIDs = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDKShareCameraEffectContentPeopleIDsKey];
    _placeID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKShareCameraEffectContentPlaceIDKey];
    _ref = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKShareCameraEffectContentRefKey];
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKShareCameraEffectContentPageIDKey];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDKShareCameraEffectContentUUIDKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_effectID forKey:FBSDKShareCameraEffectContentEffectIDKey];
  [encoder encodeObject:_effectArguments forKey:FBSDKShareCameraEffectContentEffectArgumentsKey];
  [encoder encodeObject:_effectTextures forKey:FBSDKShareCameraEffectContentEffectTexturesKey];
  [encoder encodeObject:_contentURL forKey:FBSDKShareCameraEffectContentContentURLKey];
  [encoder encodeObject:_hashtag forKey:FBSDKShareCameraEffectContentHashtagKey];
  [encoder encodeObject:_peopleIDs forKey:FBSDKShareCameraEffectContentPeopleIDsKey];
  [encoder encodeObject:_placeID forKey:FBSDKShareCameraEffectContentPlaceIDKey];
  [encoder encodeObject:_ref forKey:FBSDKShareCameraEffectContentRefKey];
  [encoder encodeObject:_pageID forKey:FBSDKShareCameraEffectContentPageIDKey];
  [encoder encodeObject:_shareUUID forKey:FBSDKShareCameraEffectContentUUIDKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareCameraEffectContent *copy = [[FBSDKShareCameraEffectContent alloc] init];
  copy->_effectID = [_effectID copy];
  copy->_effectArguments = [_effectArguments copy];
  copy->_effectTextures = [_effectTextures copy];
  copy->_contentURL = [_contentURL copy];
  copy->_hashtag = [_hashtag copy];
  copy->_peopleIDs = [_peopleIDs copy];
  copy->_placeID = [_placeID copy];
  copy->_ref = [_ref copy];
  copy->_pageID = [_pageID copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
