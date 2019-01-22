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

#import "FBSDKCameraEffectArguments+Internal.h"
#import "FBSDKCameraEffectTextures+Internal.h"
#import "FBSDKCoreKit+Internal.h"
#import "FBSDKHashtag.h"
#import "FBSDKShareUtility.h"

static NSString *const kFBSDKShareCameraEffectContentEffectIDKey = @"effectID";
static NSString *const kFBSDKShareCameraEffectContentEffectArgumentsKey = @"effectArguments";
static NSString *const kFBSDKShareCameraEffectContentEffectTexturesKey = @"effectTextures";
static NSString *const kFBSDKShareCameraEffectContentContentURLKey = @"contentURL";
static NSString *const kFBSDKShareCameraEffectContentHashtagKey = @"hashtag";
static NSString *const kFBSDKShareCameraEffectContentPeopleIDsKey = @"peopleIDs";
static NSString *const kFBSDKShareCameraEffectContentPlaceIDKey = @"placeID";
static NSString *const kFBSDKShareCameraEffectContentRefKey = @"ref";
static NSString *const kFBSDKShareCameraEffectContentPageIDKey = @"pageID";
static NSString *const kFBSDKShareCameraEffectContentUUIDKey = @"uuid";

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
  [FBSDKInternalUtility dictionary:updatedParameters
                         setObject:_effectID
                            forKey:@"effect_id"];

  NSString *effectArgumentsJSON;
  if (_effectArguments) {
    effectArgumentsJSON = [FBSDKInternalUtility JSONStringForObject:[_effectArguments allArguments]
                                                              error:NULL
                                               invalidObjectHandler:NULL];
  }
  [FBSDKInternalUtility dictionary:updatedParameters
                         setObject:effectArgumentsJSON
                            forKey:@"effect_arguments"];

  NSData *effectTexturesData;
  if (_effectTextures) {
    // Convert the entire textures dictionary into one NSData, because
    // the existing API protocol only allows one value to be put into the pasteboard.
    NSDictionary<NSString *, UIImage *> *texturesDict = [_effectTextures allTextures];
    NSMutableDictionary<NSString *, NSData *> *texturesDataDict = [NSMutableDictionary dictionaryWithCapacity:texturesDict.count];
    [texturesDict enumerateKeysAndObjectsUsingBlock:^(NSString *key, UIImage *img, BOOL *stop) {
      // Convert UIImages to NSData, because UIImage is not archivable.
      NSData *imageData = UIImagePNGRepresentation(img);
      if (imageData) {
        texturesDataDict[key] = imageData;
      }
    }];
    effectTexturesData = [NSKeyedArchiver archivedDataWithRootObject:texturesDataDict];
  }
  [FBSDKInternalUtility dictionary:updatedParameters
                         setObject:effectTexturesData
                            forKey:@"effect_textures"];

  return updatedParameters;
}

#pragma mark - FBSDKSharingScheme

- (NSString *)schemeForMode:(FBSDKShareDialogMode)mode
{
  if ((FBSDKShareDialogModeNative == mode) || (FBSDKShareDialogModeAutomatic == mode)) {
    if ([FBSDKInternalUtility isMSQRDPlayerAppInstalled]) {
      // If installed, launch MSQRD Player for testing effects.
      return FBSDK_CANOPENURL_MSQRD_PLAYER;
    }
  }
  return nil;
}

#pragma mark - FBSDKSharingValidation

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  if (_effectID.length > 0) {
    NSCharacterSet* nonDigitCharacters = [NSCharacterSet decimalDigitCharacterSet].invertedSet;
    if ([_effectID rangeOfCharacterFromSet:nonDigitCharacters].location != NSNotFound) {
      if (errorRef != NULL) {
        *errorRef = [NSError fbInvalidArgumentErrorWithName:@"effectID"
                                                      value:_effectID
                                                    message:@"Invalid value for effectID, effectID can contain only numerical characters."];
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
    _effectID.hash,
    _effectArguments.hash,
    _effectTextures.hash,
    _contentURL.hash,
    _hashtag.hash,
    _peopleIDs.hash,
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

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _effectID = [decoder decodeObjectOfClass:[NSString class] forKey:kFBSDKShareCameraEffectContentEffectIDKey];
    _effectArguments = [decoder decodeObjectOfClass:[FBSDKCameraEffectArguments class] forKey:kFBSDKShareCameraEffectContentEffectArgumentsKey];
    _effectTextures = [decoder decodeObjectOfClass:[FBSDKCameraEffectTextures class] forKey:kFBSDKShareCameraEffectContentEffectTexturesKey];
    _contentURL = [decoder decodeObjectOfClass:[NSURL class] forKey:kFBSDKShareCameraEffectContentContentURLKey];
    _hashtag = [decoder decodeObjectOfClass:[FBSDKHashtag class] forKey:kFBSDKShareCameraEffectContentHashtagKey];
    _peopleIDs = [decoder decodeObjectOfClass:[NSArray class] forKey:kFBSDKShareCameraEffectContentPeopleIDsKey];
    _placeID = [decoder decodeObjectOfClass:[NSString class] forKey:kFBSDKShareCameraEffectContentPlaceIDKey];
    _ref = [decoder decodeObjectOfClass:[NSString class] forKey:kFBSDKShareCameraEffectContentRefKey];
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:kFBSDKShareCameraEffectContentPageIDKey];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:kFBSDKShareCameraEffectContentUUIDKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_effectID forKey:kFBSDKShareCameraEffectContentEffectIDKey];
  [encoder encodeObject:_effectArguments forKey:kFBSDKShareCameraEffectContentEffectArgumentsKey];
  [encoder encodeObject:_effectTextures forKey:kFBSDKShareCameraEffectContentEffectTexturesKey];
  [encoder encodeObject:_contentURL forKey:kFBSDKShareCameraEffectContentContentURLKey];
  [encoder encodeObject:_hashtag forKey:kFBSDKShareCameraEffectContentHashtagKey];
  [encoder encodeObject:_peopleIDs forKey:kFBSDKShareCameraEffectContentPeopleIDsKey];
  [encoder encodeObject:_placeID forKey:kFBSDKShareCameraEffectContentPlaceIDKey];
  [encoder encodeObject:_ref forKey:kFBSDKShareCameraEffectContentRefKey];
  [encoder encodeObject:_pageID forKey:kFBSDKShareCameraEffectContentPageIDKey];
  [encoder encodeObject:_shareUUID forKey:kFBSDKShareCameraEffectContentUUIDKey];
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
