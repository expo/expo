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

#import "FBSDKGameRequestContent.h"

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareUtility.h"

#define FBSDK_APP_REQUEST_CONTENT_TO_KEY @"to"
#define FBSDK_APP_REQUEST_CONTENT_MESSAGE_KEY @"message"
#define FBSDK_APP_REQUEST_CONTENT_ACTION_TYPE_KEY @"actionType"
#define FBSDK_APP_REQUEST_CONTENT_OBJECT_ID_KEY @"objectID"
#define FBSDK_APP_REQUEST_CONTENT_FILTERS_KEY @"filters"
#define FBSDK_APP_REQUEST_CONTENT_SUGGESTIONS_KEY @"suggestions"
#define FBSDK_APP_REQUEST_CONTENT_DATA_KEY @"data"
#define FBSDK_APP_REQUEST_CONTENT_TITLE_KEY @"title"

@implementation FBSDKGameRequestContent

#pragma mark - Properties

-(void)setRecipients:(NSArray *)recipients
{
  [FBSDKShareUtility assertCollection:recipients ofClass:[NSString class] name:@"recipients"];
  if (![_recipients isEqual:recipients]) {
    _recipients = [recipients copy];
  }
}

- (void)setRecipientSuggestions:(NSArray *)recipientSuggestions
{
  [FBSDKShareUtility assertCollection:recipientSuggestions ofClass:[NSString class] name:@"recipientSuggestions"];
  if (![_recipientSuggestions isEqual:recipientSuggestions]) {
    _recipientSuggestions = [recipientSuggestions copy];
  }
}

- (NSArray *)suggestions
{
  return self.recipientSuggestions;
}

- (void)setSuggestions:(NSArray *)suggestions
{
  self.recipientSuggestions = suggestions;
}

- (NSArray *)to
{
  return self.recipients;
}

- (void)setTo:(NSArray *)to
{
  self.recipients = to;
}

#pragma mark - FBSDKSharingValidation

- (BOOL)validateWithOptions:(FBSDKShareBridgeOptions)bridgeOptions error:(NSError *__autoreleasing *)errorRef
{
  if (![FBSDKShareUtility validateRequiredValue:_message name:@"message" error:errorRef]) {
    return NO;
  }
  BOOL mustHaveobjectID = _actionType == FBSDKGameRequestActionTypeSend
  || _actionType == FBSDKGameRequestActionTypeAskFor;
  BOOL hasobjectID = _objectID.length > 0;
  if (mustHaveobjectID ^ hasobjectID) {
    if (errorRef != NULL) {
      NSString *message = @"The objectID is required when the actionType is either send or askfor.";
      *errorRef = [NSError fbRequiredArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                        name:@"objectID"
                                                     message:message];
    }
    return NO;
  }
  BOOL hasTo = _recipients.count > 0;
  BOOL hasFilters = _filters != FBSDKGameRequestFilterNone;
  BOOL hasSuggestions = _recipientSuggestions.count > 0;
  if (hasTo && hasFilters) {
    if (errorRef != NULL) {
      NSString *message = @"Cannot specify to and filters at the same time.";
      *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                       name:@"recipients"
                                                      value:_recipients
                                                    message:message];
    }
    return NO;
  }
  if (hasTo && hasSuggestions) {
    if (errorRef != NULL) {
      NSString *message = @"Cannot specify to and suggestions at the same time.";
      *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                       name:@"recipients"
                                                      value:_recipients
                                                    message:message];
    }
    return NO;
  }

  if (hasFilters && hasSuggestions) {
    if (errorRef != NULL) {
      NSString *message = @"Cannot specify filters and suggestions at the same time.";
      *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                       name:@"recipientSuggestions"
                                                      value:_recipientSuggestions
                                                    message:message];
    }
    return NO;
  }

  if (_data.length > 255) {
    if (errorRef != NULL) {
      NSString *message = @"The data cannot be longer than 255 characters";
      *errorRef = [NSError fbInvalidArgumentErrorWithDomain:FBSDKShareErrorDomain
                                                       name:@"data"
                                                      value:_data
                                                    message:message];
    }
    return NO;
  }

  if (errorRef != NULL) {
    *errorRef = nil;
  }

  return [FBSDKShareUtility validateArgumentWithName:@"actionType"
                                               value:_actionType
                                                isIn:@[@(FBSDKGameRequestActionTypeNone),
                                                       @(FBSDKGameRequestActionTypeSend),
                                                       @(FBSDKGameRequestActionTypeAskFor),
                                                       @(FBSDKGameRequestActionTypeTurn)]
                                               error:errorRef]
    && [FBSDKShareUtility validateArgumentWithName:@"filters"
                                             value:_filters
                                              isIn:@[@(FBSDKGameRequestFilterNone),
                                                     @(FBSDKGameRequestFilterAppUsers),
                                                     @(FBSDKGameRequestFilterAppNonUsers)]
                                             error:errorRef];
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [FBSDKMath hashWithInteger:_actionType],
    _data.hash,
    [FBSDKMath hashWithInteger:_filters],
    _message.hash,
    _objectID.hash,
    _recipientSuggestions.hash,
    _title.hash,
    _recipients.hash,
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKGameRequestContent class]]) {
    return NO;
  }
  return [self isEqualToGameRequestContent:(FBSDKGameRequestContent *)object];
}

- (BOOL)isEqualToGameRequestContent:(FBSDKGameRequestContent *)content
{
  return (content &&
          _actionType == content.actionType &&
          _filters == content.filters &&
          [FBSDKInternalUtility object:_data isEqualToObject:content.data] &&
          [FBSDKInternalUtility object:_message isEqualToObject:content.message] &&
          [FBSDKInternalUtility object:_objectID isEqualToObject:content.objectID] &&
          [FBSDKInternalUtility object:_recipientSuggestions isEqualToObject:content.recipientSuggestions] &&
          [FBSDKInternalUtility object:_title isEqualToObject:content.title] &&
          [FBSDKInternalUtility object:_recipients isEqualToObject:content.recipients]);
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ((self = [self init])) {
    _actionType = [decoder decodeIntegerForKey:FBSDK_APP_REQUEST_CONTENT_ACTION_TYPE_KEY];
    _data = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_APP_REQUEST_CONTENT_DATA_KEY];
    _filters = [decoder decodeIntegerForKey:FBSDK_APP_REQUEST_CONTENT_FILTERS_KEY];
    _message = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_APP_REQUEST_CONTENT_MESSAGE_KEY];
    _objectID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_APP_REQUEST_CONTENT_OBJECT_ID_KEY];
    _recipientSuggestions = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_APP_REQUEST_CONTENT_SUGGESTIONS_KEY];
    _title = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_APP_REQUEST_CONTENT_TITLE_KEY];
    _recipients = [decoder decodeObjectOfClass:[NSArray class] forKey:FBSDK_APP_REQUEST_CONTENT_TO_KEY];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeInteger:_actionType forKey:FBSDK_APP_REQUEST_CONTENT_ACTION_TYPE_KEY];
  [encoder encodeObject:_data forKey:FBSDK_APP_REQUEST_CONTENT_DATA_KEY];
  [encoder encodeInteger:_filters forKey:FBSDK_APP_REQUEST_CONTENT_FILTERS_KEY];
  [encoder encodeObject:_message forKey:FBSDK_APP_REQUEST_CONTENT_MESSAGE_KEY];
  [encoder encodeObject:_objectID forKey:FBSDK_APP_REQUEST_CONTENT_OBJECT_ID_KEY];
  [encoder encodeObject:_recipientSuggestions forKey:FBSDK_APP_REQUEST_CONTENT_SUGGESTIONS_KEY];
  [encoder encodeObject:_title forKey:FBSDK_APP_REQUEST_CONTENT_TITLE_KEY];
  [encoder encodeObject:_recipients forKey:FBSDK_APP_REQUEST_CONTENT_TO_KEY];
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  FBSDKGameRequestContent *copy = [[FBSDKGameRequestContent alloc] init];
  copy->_actionType = _actionType;
  copy->_data = [_data copy];
  copy->_filters = _filters;
  copy->_message = [_message copy];
  copy->_objectID = [_objectID copy];
  copy->_recipientSuggestions = [_recipientSuggestions copy];
  copy->_title = [_title copy];
  copy->_recipients = [_recipients copy];
  return copy;
}

@end
