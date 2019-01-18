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

#import "FBSDKShareMessengerGenericTemplateContent.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareMessengerContentUtility.h"
#import "FBSDKShareMessengerGenericTemplateElement.h"
#import "FBSDKShareMessengerURLActionButton.h"
#import "FBSDKShareUtility.h"

static NSString *const kGenericTemplatePageIDKey = @"pageID";
static NSString *const kGenericTemplateUUIDKey = @"UUID";
static NSString *const kGenericTemplateIsSharableKey = @"isSharable";
static NSString *const kGenericTemplateImageAspectRatioKey = @"imageAspectRatio";
static NSString *const kGenericTemplateElementKey = @"element";

static NSString *_ImageAspectRatioString(FBSDKShareMessengerGenericTemplateImageAspectRatio imageAspectRatio)
{
  switch (imageAspectRatio) {
    case FBSDKShareMessengerGenericTemplateImageAspectRatioSquare:
      return @"square";
    case FBSDKShareMessengerGenericTemplateImageAspectRatioHorizontal:
      return @"horizontal";
  }
}

static NSArray<NSDictionary<NSString *, id> *> *_SerializableGenericTemplateElementsFromElements(NSArray<FBSDKShareMessengerGenericTemplateElement *> *elements)
{
  NSMutableArray<NSDictionary<NSString *, id> *> *serializableElements = [NSMutableArray array];
  for (FBSDKShareMessengerGenericTemplateElement *element in elements) {
    NSMutableDictionary<NSString *, id> *elementDictionary = [NSMutableDictionary dictionary];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:element.title forKey:@"title"];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:element.subtitle forKey:@"subtitle"];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:element.imageURL.absoluteString forKey:@"image_url"];
    [FBSDKInternalUtility dictionary:elementDictionary setObject:SerializableButtonsFromButton(element.button) forKey:kFBSDKShareMessengerButtonsKey];
    if ([element.defaultAction isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
      [FBSDKInternalUtility dictionary:elementDictionary setObject:SerializableButtonFromURLButton(element.defaultAction, YES) forKey:@"default_action"];
    }

    [serializableElements addObject:elementDictionary];
  }

  return serializableElements;
}

@implementation FBSDKShareMessengerGenericTemplateContent

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

  NSMutableDictionary<NSString *, id> *payload = [NSMutableDictionary dictionary];
  payload[kFBSDKShareMessengerTemplateTypeKey] = @"generic";
  payload[@"sharable"] = @(_isSharable);
  payload[@"image_aspect_ratio"] = _ImageAspectRatioString(_imageAspectRatio);
  payload[kFBSDKShareMessengerElementsKey] = _SerializableGenericTemplateElementsFromElements(@[_element]);

  NSMutableDictionary<NSString *, id> *attachment = [NSMutableDictionary dictionary];
  attachment[kFBSDKShareMessengerTypeKey] = kFBSDKShareMessengerTemplateKey;
  attachment[kFBSDKShareMessengerPayloadKey] = payload;

  NSMutableDictionary<NSString *, id> *contentForShare = [NSMutableDictionary dictionary];
  contentForShare[kFBSDKShareMessengerAttachmentKey] = attachment;

  FBSDKShareMessengerGenericTemplateElement *firstElement = _element;
  NSMutableDictionary<NSString *, id> *contentForPreview = [NSMutableDictionary dictionary];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:@"DEFAULT" forKey:@"preview_type"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:firstElement.title forKey:@"title"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:firstElement.subtitle forKey:@"subtitle"];
  [FBSDKInternalUtility dictionary:contentForPreview setObject:firstElement.imageURL.absoluteString forKey:@"image_url"];
  if (firstElement.button) {
    AddToContentPreviewDictionaryForButton(contentForPreview, firstElement.button);
  } else {
    AddToContentPreviewDictionaryForButton(contentForPreview, firstElement.defaultAction);
  }

  [FBSDKShareMessengerContentUtility addToParameters:updatedParameters contentForShare:contentForShare contentForPreview:contentForPreview];

  return updatedParameters;
}

#pragma mark - FBSDKSharingValidation

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  return [FBSDKShareUtility validateRequiredValue:_element.title
                                             name:@"element.title"
                                            error:errorRef]
      && [FBSDKShareMessengerContentUtility validateMessengerActionButton:_element.defaultAction
                                                    isDefaultActionButton:YES
                                                                   pageID:_pageID
                                                                    error:errorRef]
      && [FBSDKShareMessengerContentUtility validateMessengerActionButton:_element.button
                                                    isDefaultActionButton:NO
                                                                   pageID:_pageID
                                                                    error:errorRef];
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _pageID = [decoder decodeObjectOfClass:[NSString class] forKey:kGenericTemplatePageIDKey];
    _isSharable = [decoder decodeBoolForKey:kGenericTemplateIsSharableKey];
    _imageAspectRatio = [[decoder decodeObjectOfClass:[NSNumber class] forKey:kGenericTemplateImageAspectRatioKey] unsignedIntegerValue];
    _element = [decoder decodeObjectForKey:kGenericTemplateElementKey];
    _shareUUID = [decoder decodeObjectOfClass:[NSString class] forKey:kGenericTemplateUUIDKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:_pageID forKey:kGenericTemplatePageIDKey];
  [encoder encodeBool:_isSharable forKey:kGenericTemplateIsSharableKey];
  [encoder encodeObject:@(_imageAspectRatio) forKey:kGenericTemplateImageAspectRatioKey];
  [encoder encodeObject:_element forKey:kGenericTemplateElementKey];
  [encoder encodeObject:_shareUUID forKey:kGenericTemplateUUIDKey];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKShareMessengerGenericTemplateContent *copy = [[FBSDKShareMessengerGenericTemplateContent alloc] init];
  copy->_pageID = [_pageID copy];
  copy->_isSharable = _isSharable;
  copy->_imageAspectRatio = _imageAspectRatio;
  copy->_element = [_element copy];
  copy->_shareUUID = [_shareUUID copy];
  return copy;
}

@end
