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

#import "FBSDKShareUtility.h"

#import <FBSDKShareKit/FBSDKHashtag.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareError.h"
#import "FBSDKShareLinkContent+Internal.h"
#import "FBSDKShareMediaContent.h"
#import "FBSDKShareOpenGraphContent.h"
#import "FBSDKShareOpenGraphObject.h"
#import "FBSDKSharePhoto.h"
#import "FBSDKSharePhotoContent.h"
#import "FBSDKShareVideo.h"
#import "FBSDKShareVideoContent.h"
#import "FBSDKSharingContent.h"

#if !TARGET_OS_TV
#import "FBSDKCameraEffectArguments+Internal.h"
#import "FBSDKCameraEffectTextures+Internal.h"
#import "FBSDKShareMessengerContentUtility.h"
#import "FBSDKShareMessengerGenericTemplateContent.h"
#import "FBSDKShareMessengerGenericTemplateElement.h"
#import "FBSDKShareMessengerMediaTemplateContent.h"
#import "FBSDKShareMessengerOpenGraphMusicTemplateContent.h"
#import "FBSDKShareMessengerURLActionButton.h"
#endif

@implementation FBSDKShareUtility

#pragma mark - Class Methods

+ (void)assertCollection:(id<NSFastEnumeration>)collection ofClassStrings:(NSArray *)classStrings name:(NSString *)name
{
  for (id item in collection) {
    BOOL validClass = NO;
    for (NSString *classString in classStrings) {
      if ([item isKindOfClass:NSClassFromString(classString)]) {
        validClass = YES;
        break;
      }
    }
    if (!validClass) {
      NSString *reason = [[NSString alloc] initWithFormat:
                          @"Invalid value found in %@: %@ - %@",
                          name,
                          item,
                          collection];
      @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
    }
  }
}

+ (void)assertCollection:(id<NSFastEnumeration>)collection ofClass:itemClass name:(NSString *)name
{
  for (id item in collection) {
    if (![item isKindOfClass:itemClass]) {
      NSString *reason = [[NSString alloc] initWithFormat:
                          @"Invalid value found in %@: %@ - %@",
                          name,
                          item,
                          collection];
      @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
    }
  }
}

+ (void)assertOpenGraphKey:(id)key requireNamespace:(BOOL)requireNamespace
{
  if (![key isKindOfClass:[NSString class]]) {
    NSString *reason = [[NSString alloc] initWithFormat:@"Invalid key found in Open Graph dictionary: %@", key];
    @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
  }
  if (!requireNamespace) {
    return;
  }
  NSArray *components = [key componentsSeparatedByString:@":"];
  if ([components count] < 2) {
    NSString *reason = [[NSString alloc] initWithFormat:@"Open Graph keys must be namespaced: %@", key];
    @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
  }
  for (NSString *component in components) {
    if (![component length]) {
      NSString *reason = [[NSString alloc] initWithFormat:@"Invalid key found in Open Graph dictionary: %@", key];
      @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
    }
  }
}

+ (void)assertOpenGraphValue:(id)value
{
  if ([self _isOpenGraphValue:value]) {
    return;
  }
  if ([value isKindOfClass:[NSDictionary class]]) {
    [self assertOpenGraphValues:(NSDictionary *)value requireKeyNamespace:YES];
    return;
  }
  if ([value isKindOfClass:[NSArray class]]) {
    for (id subValue in (NSArray *)value) {
      [self assertOpenGraphValue:subValue];
    }
    return;
  }
  NSString *reason = [[NSString alloc] initWithFormat:@"Invalid Open Graph value found: %@", value];
  @throw [NSException exceptionWithName:NSInvalidArgumentException reason:reason userInfo:nil];
}

+ (void)assertOpenGraphValues:(NSDictionary *)dictionary requireKeyNamespace:(BOOL)requireKeyNamespace
{
  [dictionary enumerateKeysAndObjectsUsingBlock:^(id key, id value, BOOL *stop) {
    [self assertOpenGraphKey:key requireNamespace:requireKeyNamespace];
    [self assertOpenGraphValue:value];
  }];
}

+ (BOOL)buildWebShareContent:(id<FBSDKSharingContent>)content
                  methodName:(NSString *__autoreleasing *)methodNameRef
                  parameters:(NSDictionary *__autoreleasing *)parametersRef
                       error:(NSError *__autoreleasing *)errorRef
{
  NSString *methodName = nil;
  NSDictionary *parameters = nil;
  if ([content isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    methodName = @"share_open_graph";
    FBSDKShareOpenGraphContent *openGraphContent = (FBSDKShareOpenGraphContent *)content;
    FBSDKShareOpenGraphAction *action = openGraphContent.action;
    NSDictionary *properties = [self _convertOpenGraphValueContainer:action requireNamespace:NO];
    NSString *propertiesJSON = [FBSDKInternalUtility JSONStringForObject:properties
                                                                   error:errorRef
                                                    invalidObjectHandler:NULL];
    parameters = @{
                   @"action_type": action.actionType,
                   @"action_properties": propertiesJSON,
                   };
  } else if ([content isKindOfClass:[FBSDKShareLinkContent class]]) {
    FBSDKShareLinkContent *linkContent = (FBSDKShareLinkContent *)content;
    methodName = @"share";
    if (linkContent.contentURL != nil) {
      parameters = @{ @"href": linkContent.contentURL.absoluteString };
    }
  }
  NSString *hashtagString = [self hashtagStringFromHashtag:content.hashtag];
  if (hashtagString != nil) {
    NSMutableDictionary *mutableParameters = [parameters mutableCopy];
    [FBSDKInternalUtility dictionary:mutableParameters setObject:hashtagString forKey:@"hashtag"];
    parameters = [mutableParameters copy];
  }
  if (methodNameRef != NULL) {
    *methodNameRef = methodName;
  }
  if (parametersRef != NULL) {
    *parametersRef = parameters;
  }
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  return YES;
}

+ (void)buildAsyncWebPhotoContent:(FBSDKSharePhotoContent *)content
                completionHandler:(void(^)(BOOL, NSString *, NSDictionary *))completion
{
  void(^stageImageCompletion)(NSArray<NSString *> *) = ^(NSArray<NSString *> *stagedURIs) {
    NSString *methodName = @"share";
    NSMutableDictionary *parameters = [[FBSDKShareUtility parametersForShareContent:content
                                                              shouldFailOnDataError:NO] mutableCopy];
    [parameters removeObjectForKey:@"photos"];

    NSString *stagedURIJSONString = [FBSDKInternalUtility JSONStringForObject:stagedURIs
                                                                        error:nil
                                                         invalidObjectHandler:NULL];
    [FBSDKInternalUtility dictionary:parameters
                           setObject:stagedURIJSONString
                              forKey:@"media"];

    NSString *hashtagString = [self hashtagStringFromHashtag:content.hashtag];
    if (hashtagString != nil) {
      [FBSDKInternalUtility dictionary:parameters
                             setObject:hashtagString
                                forKey:@"hashtag"];
    }

    if (completion != NULL) {
      completion(YES, methodName, [parameters copy]);
    }
  };

  [self _stageImagesForPhotoContent:(FBSDKSharePhotoContent *)content
              withCompletionHandler:stageImageCompletion];
}

+ (id)convertOpenGraphValue:(id)value
{
  if ([self _isOpenGraphValue:value]) {
    return value;
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    NSDictionary *properties = (NSDictionary *)value;
    if ([FBSDKTypeUtility stringValue:properties[@"type"]]) {
      return [FBSDKShareOpenGraphObject objectWithProperties:properties];
    } else {
      NSURL *imageURL = [FBSDKTypeUtility URLValue:properties[@"url"]];
      if (imageURL) {
        FBSDKSharePhoto *sharePhoto = [FBSDKSharePhoto photoWithImageURL:imageURL
                                                           userGenerated:[FBSDKTypeUtility boolValue:properties[@"user_generated"]]];
        sharePhoto.caption = [FBSDKTypeUtility stringValue:properties[@"caption"]];
        return sharePhoto;
      } else {
        return nil;
      }
    }
  } else if ([value isKindOfClass:[NSArray class]]) {
    NSMutableArray *array = [[NSMutableArray alloc] init];
    for (id subValue in (NSArray *)value) {
      [FBSDKInternalUtility array:array addObject:[self convertOpenGraphValue:subValue]];
    }
    return [array copy];
  } else {
    return nil;
  }
}

+ (NSDictionary *)convertOpenGraphValues:(NSDictionary *)dictionary
{
  NSMutableDictionary *convertedDictionary = [[NSMutableDictionary alloc] init];
  [dictionary enumerateKeysAndObjectsUsingBlock:^(id key, id obj, BOOL *stop) {
    [FBSDKInternalUtility dictionary:convertedDictionary setObject:[self convertOpenGraphValue:obj] forKey:key];
  }];
  return [convertedDictionary copy];
}

+ (NSDictionary *)feedShareDictionaryForContent:(id<FBSDKSharingContent>)content
{
  NSMutableDictionary *parameters = nil;
#pragma clang diagnostic pop
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  if ([content isKindOfClass:[FBSDKShareLinkContent class]]) {
    FBSDKShareLinkContent *linkContent = (FBSDKShareLinkContent *)content;
    parameters = [[NSMutableDictionary alloc] initWithDictionary:linkContent.feedParameters];
    [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentDescription forKey:@"description"];
    [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentURL forKey:@"link"];
    [FBSDKInternalUtility dictionary:parameters setObject:linkContent.quote forKey:@"quote"];
    [FBSDKInternalUtility dictionary:parameters setObject:[self hashtagStringFromHashtag:linkContent.hashtag] forKey:@"hashtag"];
    [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentTitle forKey:@"name"];
    [FBSDKInternalUtility dictionary:parameters setObject:linkContent.imageURL forKey:@"picture"];
    [FBSDKInternalUtility dictionary:parameters setObject:linkContent.ref forKey:@"ref"];
  }
#pragma clang diagnostic pop
  return [parameters copy];
}

+ (NSString *)hashtagStringFromHashtag:(FBSDKHashtag *)hashtag
{
  if (!hashtag) {
    return nil;
  }
  if (hashtag.isValid) {
    return hashtag.stringRepresentation;
  } else {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                       formatString:@"Invalid hashtag: '%@'", hashtag.stringRepresentation];
    return nil;
  }
}

+ (UIImage *)imageWithCircleColor:(UIColor *)color
                       canvasSize:(CGSize)canvasSize
                       circleSize:(CGSize)circleSize
{
  CGRect circleFrame = CGRectMake((canvasSize.width - circleSize.width) / 2.0,
                                  (canvasSize.height - circleSize.height) / 2.0,
                                  circleSize.width,
                                  circleSize.height);
  UIGraphicsBeginImageContextWithOptions(canvasSize, NO, 0);
  CGContextRef context = UIGraphicsGetCurrentContext();
  [color setFill];
  CGContextFillEllipseInRect(context, circleFrame);
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  return image;
}

+ (NSDictionary *)parametersForShareContent:(id<FBSDKSharingContent>)shareContent
                      shouldFailOnDataError:(BOOL)shouldFailOnDataError
{
  NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
  [self _addToParameters:parameters forShareContent:shareContent];
  parameters[@"dataFailuresFatal"] = @(shouldFailOnDataError);
  if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    [self _addToParameters:parameters forShareLinkContent:(FBSDKShareLinkContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    [self _addToParameters:parameters forSharePhotoContent:(FBSDKSharePhotoContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    [self _addToParameters:parameters forShareVideoContent:(FBSDKShareVideoContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    [self _addToParameters:parameters forShareOpenGraphContent:(FBSDKShareOpenGraphContent *)shareContent];
#if !TARGET_OS_TV
  } else if ([shareContent isKindOfClass:[FBSDKShareMessengerGenericTemplateContent class]]) {
    [FBSDKShareMessengerContentUtility addToParameters:parameters
               forShareMessengerGenericTemplateContent:(FBSDKShareMessengerGenericTemplateContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKShareMessengerMediaTemplateContent class]]) {
    [FBSDKShareMessengerContentUtility addToParameters:parameters
                 forShareMessengerMediaTemplateContent:(FBSDKShareMessengerMediaTemplateContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKShareMessengerOpenGraphMusicTemplateContent class]]) {
    [FBSDKShareMessengerContentUtility addToParameters:parameters
        forShareMessengerOpenGraphMusicTemplateContent:(FBSDKShareMessengerOpenGraphMusicTemplateContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    [self _addToParameters:parameters forShareCameraEffectContent:(FBSDKShareCameraEffectContent *)shareContent];
#endif
  }
  return [parameters copy];
}

+ (void)testShareContent:(id<FBSDKSharingContent>)shareContent
           containsMedia:(BOOL *)containsMediaRef
          containsPhotos:(BOOL *)containsPhotosRef
          containsVideos:(BOOL *)containsVideosRef
{
  BOOL containsMedia = NO;
  BOOL containsPhotos = NO;
  BOOL containsVideos = NO;
  if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    containsMedia = NO;
    containsPhotos = NO;
    containsVideos = NO;
  } else if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    containsMedia = YES;
    containsVideos = YES;
    containsPhotos = NO;
  } else if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    [self _testObject:((FBSDKSharePhotoContent *)shareContent).photos
        containsMedia:&containsMedia
       containsPhotos:&containsPhotos
       containsVideos:&containsVideos];
  } else if ([shareContent isKindOfClass:[FBSDKShareMediaContent class]]) {
    [self _testObject:((FBSDKShareMediaContent *)shareContent).media
        containsMedia:&containsMedia
       containsPhotos:&containsPhotos
       containsVideos:&containsVideos];
  } else if ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    [self _testOpenGraphValueContainer:((FBSDKShareOpenGraphContent *)shareContent).action
                         containsMedia:&containsMedia
                        containsPhotos:&containsPhotos
                        containsVideos:&containsVideos];
  }
  if (containsMediaRef != NULL) {
    *containsMediaRef = containsMedia;
  }
  if (containsPhotosRef != NULL) {
    *containsPhotosRef = containsPhotos;
  }
  if (containsVideosRef != NULL) {
    *containsVideosRef = containsVideos;
  }
}

#if !TARGET_OS_TV
+ (BOOL)validateAppInviteContent:(FBSDKAppInviteContent *)appInviteContent error:(NSError *__autoreleasing *)errorRef
{
  return ([self _validateRequiredValue:appInviteContent name:@"content" error:errorRef] &&
          [self _validateRequiredValue:appInviteContent.appLinkURL name:@"appLinkURL" error:errorRef] &&
          [self _validateNetworkURL:appInviteContent.appLinkURL name:@"appLinkURL" error:errorRef] &&
          [self _validateNetworkURL:appInviteContent.appInvitePreviewImageURL name:@"appInvitePreviewImageURL" error:errorRef] &&
          [self validatePromoCodeWithError:appInviteContent error:errorRef]);
}

+ (BOOL)validatePromoCodeWithError:(FBSDKAppInviteContent *)appInviteContent error:(NSError *__autoreleasing *)errorRef
{
  NSString *promoText = appInviteContent.promotionText;
  NSString *promoCode = appInviteContent.promotionCode;
  NSMutableCharacterSet *alphanumericWithSpaces = [NSMutableCharacterSet alphanumericCharacterSet];
  [alphanumericWithSpaces formUnionWithCharacterSet:[NSCharacterSet whitespaceCharacterSet]];

  if ([promoText length] > 0 || [promoCode length] > 0) {

    // Check for validity of promo text and promo code.
    if (!([promoText length] > 0 && [promoText length] <= 80)) {
      if (errorRef != NULL) {
        *errorRef = [FBSDKError invalidArgumentErrorWithName:@"promotionText" value:promoText message:@"Invalid value for promotionText, promotionText has to be between 1 and 80 characters long."];
      }
      return NO;
    }

    if (!([promoCode length] <= 10)) {
      if (errorRef != NULL) {
        *errorRef = [FBSDKError invalidArgumentErrorWithName:@"promotionCode" value:promoCode message:@"Invalid value for promotionCode, promotionCode has to be between 0 and 10 characters long and is required when promoCode is set."];
      }
      return NO;
    }

    if ([promoText rangeOfCharacterFromSet:[alphanumericWithSpaces invertedSet]].location != NSNotFound) {
      if(errorRef != NULL) {
        *errorRef = [FBSDKError invalidArgumentErrorWithName:@"promotionText" value:promoText message:@"Invalid value for promotionText, promotionText can contain only alphanumeric characters and spaces."];
      }
      return NO;
    }

    if ([promoCode length] > 0 && [promoCode rangeOfCharacterFromSet:[alphanumericWithSpaces invertedSet]].location != NSNotFound) {
      if (errorRef != NULL) {
        *errorRef = [FBSDKError invalidArgumentErrorWithName:@"promotionCode" value:promoCode message:@"Invalid value for promotionCode, promotionCode can contain only alphanumeric characters and spaces."];
      }
      return NO;
    }

  }

  if (errorRef != NULL) {
    *errorRef = nil;
  }

  return YES;
}

+ (BOOL)validateShareCameraEffectContent:(FBSDKShareCameraEffectContent *)ShareCameraEffectContent
                                   error:(NSError *__autoreleasing *)errorRef {
  NSString *effectID = ShareCameraEffectContent.effectID;
  NSCharacterSet* nonDigitCharacters = [[NSCharacterSet decimalDigitCharacterSet] invertedSet];

  if ([effectID length] > 0) {
    if ([effectID rangeOfCharacterFromSet:nonDigitCharacters].location != NSNotFound) {
      if (errorRef != NULL) {
        *errorRef = [FBSDKError invalidArgumentErrorWithName:@"effectID"
                                                       value:effectID
                                                     message:@"Invalid value for effectID, effectID can contain only numerical characters."];
      }
      return NO;
    }
  }

  return YES;
}
#endif

+ (BOOL)validateAssetLibraryURLWithShareVideoContent:(FBSDKShareVideoContent *)videoContent name:(NSString *)name error:(NSError *__autoreleasing *)errorRef
{
  FBSDKShareVideo *video = videoContent.video;
  NSURL *videoURL = video.videoURL;
  return [self _validateAssetLibraryVideoURL:videoURL name:name error:errorRef];
}

+ (BOOL)validateAssetLibraryURLsWithShareMediaContent:(FBSDKShareMediaContent *)mediaContent name:(NSString *)name error:(NSError *__autoreleasing *)errorRef
{
  for (id media in mediaContent.media) {
    if ([media isKindOfClass:[FBSDKShareVideo class]]) {
      FBSDKShareVideo *video = (FBSDKShareVideo *)media;
      if (![self _validateAssetLibraryVideoURL:video.videoURL name:name error:errorRef]) {
        return NO;
      }
    }
  }
  return YES;
}

#if !TARGET_OS_TV
+ (BOOL)validateGameRequestContent:(FBSDKGameRequestContent *)gameRequestContent error:(NSError *__autoreleasing *)errorRef
{
  if (![self _validateRequiredValue:gameRequestContent name:@"content" error:errorRef]
      || ![self _validateRequiredValue:gameRequestContent.message name:@"message" error:errorRef]) {
    return NO;
  }
  BOOL mustHaveobjectID = gameRequestContent.actionType == FBSDKGameRequestActionTypeSend
  || gameRequestContent.actionType == FBSDKGameRequestActionTypeAskFor;
  BOOL hasobjectID = [gameRequestContent.objectID length] > 0;
  if (mustHaveobjectID ^ hasobjectID) {
    if (errorRef != NULL) {
      NSString *message = @"The objectID is required when the actionType is either send or askfor.";
      *errorRef = [FBSDKShareError requiredArgumentErrorWithName:@"objectID" message:message];
    }
    return NO;
  }
  BOOL hasTo = [gameRequestContent.recipients count] > 0;
  BOOL hasFilters = gameRequestContent.filters != FBSDKGameRequestFilterNone;
  BOOL hasSuggestions = [gameRequestContent.recipientSuggestions count] > 0;
  if (hasTo && hasFilters) {
    if (errorRef != NULL) {
      NSString *message = @"Cannot specify to and filters at the same time.";
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"recipients" value:gameRequestContent.recipients message:message];
    }
    return NO;
  }
  if (hasTo && hasSuggestions) {
    if (errorRef != NULL) {
      NSString *message = @"Cannot specify to and suggestions at the same time.";
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"recipients" value:gameRequestContent.recipients message:message];
    }
    return NO;
  }

  if (hasFilters && hasSuggestions) {
    if (errorRef != NULL) {
      NSString *message = @"Cannot specify filters and suggestions at the same time.";
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"recipientSuggestions" value:gameRequestContent.recipientSuggestions message:message];
    }
    return NO;
  }

  if ([gameRequestContent.data length] > 255) {
    if (errorRef != NULL) {
      NSString *message = @"The data cannot be longer than 255 characters";
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"data" value:gameRequestContent.data message:message];
    }
    return NO;
  }

  if (errorRef != NULL) {
    *errorRef = nil;
  }

  return [self _validateArgumentWithName:@"actionType"
                                   value:gameRequestContent.actionType
                                    isIn:@[@(FBSDKGameRequestActionTypeNone),
                                           @(FBSDKGameRequestActionTypeSend),
                                           @(FBSDKGameRequestActionTypeAskFor),
                                           @(FBSDKGameRequestActionTypeTurn)]
                                   error:errorRef]
  && [self _validateArgumentWithName:@"filters"
                               value:gameRequestContent.filters
                                isIn:@[@(FBSDKGameRequestFilterNone),
                                       @(FBSDKGameRequestFilterAppUsers),
                                       @(FBSDKGameRequestFilterAppNonUsers)]
                               error:errorRef];
}
#endif

+ (BOOL)validateShareContent:(id<FBSDKSharingContent>)shareContent error:(NSError *__autoreleasing *)errorRef
{
  if (![self _validateRequiredValue:shareContent name:@"shareContent" error:errorRef]) {
    return NO;
  } else if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    return [self validateShareLinkContent:(FBSDKShareLinkContent *)shareContent error:errorRef];
  } else if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    return [self validateSharePhotoContent:(FBSDKSharePhotoContent *)shareContent error:errorRef];
  } else if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    return [self validateShareVideoContent:(FBSDKShareVideoContent *)shareContent error:errorRef];
  } else if ([shareContent isKindOfClass:[FBSDKShareMediaContent class]]) {
    return [self validateShareMediaContent:(FBSDKShareMediaContent *)shareContent error:errorRef];
  } else if ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    return [self validateShareOpenGraphContent:(FBSDKShareOpenGraphContent *)shareContent error:errorRef];
#if !TARGET_OS_TV
  } else if ([shareContent isKindOfClass:[FBSDKShareMessengerMediaTemplateContent class]]) {
    return [self validateMessengerMediaTemplateContent:(FBSDKShareMessengerMediaTemplateContent *)shareContent error:errorRef];
  } else if ([shareContent isKindOfClass:[FBSDKShareMessengerGenericTemplateContent class]]) {
    return [self validateMessengerGenericTemplateContent:(FBSDKShareMessengerGenericTemplateContent *)shareContent error:errorRef];
  } else if ([shareContent isKindOfClass:[FBSDKShareMessengerOpenGraphMusicTemplateContent class]]) {
    return [self validateMessengerOpenGraphMusicTemplateContent:(FBSDKShareMessengerOpenGraphMusicTemplateContent *)shareContent error:errorRef];
  } else if ([shareContent isKindOfClass:[FBSDKShareCameraEffectContent class]]) {
    return [self validateShareCameraEffectContent:(FBSDKShareCameraEffectContent *)shareContent error:errorRef];
#endif
  } else {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"shareContent" value:shareContent message:nil];
    }
    return NO;
  }
}

+ (BOOL)validateShareOpenGraphContent:(FBSDKShareOpenGraphContent *)openGraphContent
                                error:(NSError *__autoreleasing *)errorRef
{
  FBSDKShareOpenGraphAction *action = openGraphContent.action;
  NSString *previewPropertyName = openGraphContent.previewPropertyName;
  id object = action[previewPropertyName];
  return ([self _validateRequiredValue:openGraphContent name:@"shareContent" error:errorRef] &&
          [self _validateRequiredValue:action name:@"action" error:errorRef] &&
          [self _validateRequiredValue:previewPropertyName name:@"previewPropertyName" error:errorRef] &&
          [self _validateRequiredValue:object name:previewPropertyName error:errorRef]);
}

+ (BOOL)validateSharePhotoContent:(FBSDKSharePhotoContent *)photoContent error:(NSError *__autoreleasing *)errorRef
{
  NSArray *photos = photoContent.photos;
  if (![self _validateRequiredValue:photoContent name:@"shareContent" error:errorRef] ||
      ![self _validateArray:photos minCount:1 maxCount:6 name:@"photos" error:errorRef]) {
    return NO;
  }
  for (FBSDKSharePhoto *photo in photos) {
    if (!photo.image) {
      if (errorRef != NULL) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"photos"
                                                            value:photos
                                                          message:@"photos must have UIImages"];
      }
      return NO;
    }
  }
  return YES;
}

+ (BOOL)validateShareMediaContent:(FBSDKShareMediaContent *)mediaContent error:(NSError *__autoreleasing *)errorRef
{
  NSArray *medias = mediaContent.media;
  if (![self _validateRequiredValue:mediaContent name:@"shareContent" error:errorRef] ||
      ![self _validateArray:medias minCount:1 maxCount:20 name:@"photos" error:errorRef]) {
    return NO;
  }
  int videoCount = 0;
  for (id media in medias) {
    if ([media isKindOfClass:[FBSDKSharePhoto class]]) {
      FBSDKSharePhoto *photo = (FBSDKSharePhoto *)media;
      if (!photo.image) {
        if (errorRef != NULL) {
          *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"media"
                                                              value:media
                                                            message:@"photos must have UIImages"];
        }
        return NO;
      }
    } else if ([media isKindOfClass:[FBSDKShareVideo class]]) {
      if (videoCount > 0) {
        if (errorRef != NULL) {
          *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"media"
                                                              value:media
                                                            message:@"Only 1 video is allowed"];
          return NO;
        }
      }
      videoCount++;
      FBSDKShareVideo *video = (FBSDKShareVideo *)media;
      NSURL *videoURL = video.videoURL;
      if (![self _validateRequiredValue:video name:@"video" error:errorRef] &&
          [self _validateRequiredValue:videoURL name:@"videoURL" error:errorRef]) {
        return NO;
      }

    } else {
      if (errorRef != NULL) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"media"
                                                            value:media
                                                          message:@"Only FBSDKSharePhoto and FBSDKShareVideo are allowed in `media` property"];
      }
      return NO;
    }
  }
  return YES;
}

+ (BOOL)validateShareLinkContent:(FBSDKShareLinkContent *)linkContent error:(NSError *__autoreleasing *)errorRef
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  return ([self _validateRequiredValue:linkContent name:@"shareContent" error:errorRef] &&
          [self _validateNetworkURL:linkContent.contentURL name:@"contentURL" error:errorRef] &&
          [self _validateNetworkURL:linkContent.imageURL name:@"imageURL" error:errorRef]);
#pragma clang diagnostic pop
}

+ (BOOL)validateShareVideoContent:(FBSDKShareVideoContent *)videoContent error:(NSError *__autoreleasing *)errorRef
{
  FBSDKShareVideo *video = videoContent.video;
  NSURL *videoURL = video.videoURL;
  return ([self _validateRequiredValue:videoContent name:@"videoContent" error:errorRef] &&
          [self _validateRequiredValue:video name:@"video" error:errorRef] &&
          [self _validateRequiredValue:videoURL name:@"videoURL" error:errorRef]);
}

#if !TARGET_OS_TV

+ (BOOL)validateMessengerMediaTemplateContent:(FBSDKShareMessengerMediaTemplateContent *)messengerMediaTemplateContent
                                        error:(NSError *__autoreleasing *)errorRef
{
  if (!messengerMediaTemplateContent.mediaURL && !messengerMediaTemplateContent.attachmentID) {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError requiredArgumentErrorWithName:@"attachmentID/mediaURL" message:@"Must specify either attachmentID or mediaURL"];
    }
    return NO;
  }
  return [self _validateMessengerActionButton:messengerMediaTemplateContent.button
                        isDefaultActionButton:NO
                                       pageID:messengerMediaTemplateContent.pageID
                                        error:errorRef];
}

+ (BOOL)validateMessengerGenericTemplateContent:(FBSDKShareMessengerGenericTemplateContent *)genericTemplateContent
                                          error:(NSError *__autoreleasing *)errorRef
{
  return [self _validateRequiredValue:genericTemplateContent.element.title name:@"element.title" error:errorRef] &&
  [self _validateMessengerActionButton:genericTemplateContent.element.defaultAction
                 isDefaultActionButton:YES
                                pageID:genericTemplateContent.pageID
                                 error:errorRef] &&
  [self _validateMessengerActionButton:genericTemplateContent.element.button
                 isDefaultActionButton:NO
                                pageID:genericTemplateContent.pageID
                                 error:errorRef];
}

+ (BOOL)validateMessengerOpenGraphMusicTemplateContent:(FBSDKShareMessengerOpenGraphMusicTemplateContent *)openGraphMusicTemplateContent
                                                 error:(NSError *__autoreleasing *)errorRef
{
  return [self _validateRequiredValue:openGraphMusicTemplateContent.url name:@"url" error:errorRef] &&
  [self _validateRequiredValue:openGraphMusicTemplateContent.pageID name:@"pageID" error:errorRef] &&
  [self _validateMessengerActionButton:openGraphMusicTemplateContent.button
                 isDefaultActionButton:NO
                                pageID:openGraphMusicTemplateContent.pageID
                                 error:errorRef];
}

+ (BOOL)_validateMessengerActionButton:(id<FBSDKShareMessengerActionButton>)button
                 isDefaultActionButton:(BOOL)isDefaultActionButton
                                pageID:(NSString *)pageID
                                 error:(NSError *__autoreleasing *)errorRef
{
  if (!button) {
    return YES;
  }

  if ([button isKindOfClass:[FBSDKShareMessengerURLActionButton class]]) {
    return [self _validateURLActionButton:(FBSDKShareMessengerURLActionButton *)button
                    isDefaultActionButton:isDefaultActionButton
                                   pageID:pageID
                                    error:errorRef];
  } else {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"buttons" value:button message:nil];
    }
    return NO;
  }
}

+ (BOOL)_validateURLActionButton:(FBSDKShareMessengerURLActionButton *)urlActionButton
           isDefaultActionButton:(BOOL)isDefaultActionButton
                          pageID:(NSString *)pageID
                           error:(NSError *__autoreleasing *)errorRef
{
  return [self _validateRequiredValue:urlActionButton.url name:@"button.url" error:errorRef] &&
  (!isDefaultActionButton ? [self _validateRequiredValue:urlActionButton.title name:@"button.title" error:errorRef] : YES) &&
  (urlActionButton.isMessengerExtensionURL ? [self _validateRequiredValue:pageID name:@"content pageID" error:errorRef] : YES);
}

#endif

+ (BOOL)shareMediaContentContainsPhotosAndVideos:(FBSDKShareMediaContent *)shareMediaContent
{
  BOOL containsPhotos = NO;
  BOOL containsVideos = NO;
  [self testShareContent:shareMediaContent containsMedia:NULL containsPhotos:&containsPhotos containsVideos:&containsVideos];
  return containsVideos && containsPhotos;
}

#pragma mark - Object Lifecycle

- (instancetype)init
{
  FBSDK_NO_DESIGNATED_INITIALIZER();
  return nil;
}

#pragma mark - Helper Methods

+ (void)_addToParameters:(NSMutableDictionary *)parameters forShareContent:(id<FBSDKSharingContent>)shareContent
{
  NSString *hashtagString = [self hashtagStringFromHashtag:shareContent.hashtag];
  if (hashtagString != nil) {
    [FBSDKInternalUtility dictionary:parameters setObject:@[hashtagString] forKey:@"hashtags"];
  }

  [FBSDKInternalUtility dictionary:parameters setObject:shareContent.pageID forKey:@"pageID"];
  [FBSDKInternalUtility dictionary:parameters setObject:shareContent.shareUUID forKey:@"shareUUID"];

  if ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    FBSDKShareOpenGraphAction *action = ((FBSDKShareOpenGraphContent *)shareContent).action;
    [action setArray:shareContent.peopleIDs forKey:@"tags"];
    [action setString:shareContent.placeID forKey:@"place"];
    [action setString:shareContent.ref forKey:@"ref"];
  } else {
    [FBSDKInternalUtility dictionary:parameters setObject:shareContent.peopleIDs forKey:@"tags"];
    [FBSDKInternalUtility dictionary:parameters setObject:shareContent.placeID forKey:@"place"];
    [FBSDKInternalUtility dictionary:parameters setObject:shareContent.ref forKey:@"ref"];
  }
}

+ (void)_addToParameters:(NSMutableDictionary *)parameters
forShareOpenGraphContent:(FBSDKShareOpenGraphContent *)openGraphContent
{
  NSString *previewPropertyName = [self getOpenGraphNameAndNamespaceFromFullName:openGraphContent.previewPropertyName namespace:nil];
  [FBSDKInternalUtility dictionary:parameters
                         setObject:previewPropertyName
                            forKey:@"previewPropertyName"];
  [FBSDKInternalUtility dictionary:parameters setObject:openGraphContent.action.actionType forKey:@"actionType"];
  [FBSDKInternalUtility dictionary:parameters
                         setObject:[self _convertOpenGraphValueContainer:openGraphContent.action requireNamespace:NO]
                            forKey:@"action"];
}

+ (void)_addToParameters:(NSMutableDictionary *)parameters
    forSharePhotoContent:(FBSDKSharePhotoContent *)photoContent
{
  [FBSDKInternalUtility dictionary:parameters
                         setObject:[photoContent.photos valueForKeyPath:@"image"]
                            forKey:@"photos"];
}

+ (void)_addToParameters:(NSMutableDictionary *)parameters
     forShareLinkContent:(FBSDKShareLinkContent *)linkContent
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentURL forKey:@"link"];
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentTitle forKey:@"name"];
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentDescription forKey:@"description"];
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.imageURL forKey:@"picture"];

  /**
   Pass link parameter as "messenger_link" due to versioning requirements for message dialog flow.
   We will only use the new share flow we developed if messenger_link is present, not link.
   */
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentURL forKey:@"messenger_link"];
#pragma clang diagnostic pop
}

+ (void)_addToParameters:(NSMutableDictionary *)parameters
    forShareVideoContent:(FBSDKShareVideoContent *)videoContent
{
  NSMutableDictionary *videoParameters = [[NSMutableDictionary alloc] init];
  FBSDKShareVideo *video = videoContent.video;
  NSURL *videoURL = video.videoURL;
  if (videoURL) {
    videoParameters[@"assetURL"] = videoURL;
  }
  [FBSDKInternalUtility dictionary:videoParameters
                         setObject:[self _convertPhoto:videoContent.previewPhoto]
                            forKey:@"previewPhoto"];
  parameters[@"video"] = videoParameters;
}

#if !TARGET_OS_TV
+ (void)_addToParameters:(NSMutableDictionary *)parameters
forShareCameraEffectContent:(FBSDKShareCameraEffectContent *)cameraEffectContent
{
  [FBSDKInternalUtility dictionary:parameters
                         setObject:cameraEffectContent.effectID
                            forKey:@"effect_id"];
  [FBSDKInternalUtility dictionary:parameters
                         setObject:[self _convertCameraEffectArguments:cameraEffectContent.effectArguments]
                            forKey:@"effect_arguments"];
  [FBSDKInternalUtility dictionary:parameters
                         setObject:[self _convertCameraEffectTextures:cameraEffectContent.effectTextures]
                            forKey:@"effect_textures"];
}

+ (NSString *)_convertCameraEffectArguments:(FBSDKCameraEffectArguments *)arguments
{
  // Convert a camera effect arguments container to a JSON string.
  if (arguments == nil) {
    return nil;
  }
  return [FBSDKInternalUtility JSONStringForObject:[arguments allArguments]
                                             error:NULL
                              invalidObjectHandler:NULL];
}

+ (NSData *)_convertCameraEffectTextures:(FBSDKCameraEffectTextures *)textures
{
  if (textures == nil) {
    return nil;
  }
  // Convert the entire textures dictionary into one NSData, because
  // the existing API protocol only allows one value to be put into the pasteboard.
  NSDictionary *texturesDict = [textures allTextures];
  NSMutableDictionary *texturesDataDict = [NSMutableDictionary dictionaryWithCapacity:texturesDict.count];
  [texturesDict enumerateKeysAndObjectsUsingBlock:^(NSString *key, UIImage *img, BOOL *stop) {
    // Convert UIImages to NSData, because UIImage is not archivable.
    [texturesDataDict setObject:UIImagePNGRepresentation(img) forKey:key];
  }];
  return [NSKeyedArchiver archivedDataWithRootObject:texturesDataDict];
}
#endif

+ (id)_convertObject:(id)object
{
  if ([object isKindOfClass:[FBSDKShareOpenGraphValueContainer class]]) {
    object = [self _convertOpenGraphValueContainer:(FBSDKShareOpenGraphValueContainer *)object requireNamespace:YES];
  } else if ([object isKindOfClass:[FBSDKSharePhoto class]]) {
    object = [self _convertPhoto:(FBSDKSharePhoto *)object];
  } else if ([object isKindOfClass:[NSArray class]]) {
    NSMutableArray *array = [[NSMutableArray alloc] init];
    for (id item in (NSArray *)object) {
      [FBSDKInternalUtility array:array addObject:[self _convertObject:item]];
    }
    object = array;
  }
  return object;
}

+ (NSDictionary *)_convertOpenGraphValueContainer:(FBSDKShareOpenGraphValueContainer *)container
                                 requireNamespace:(BOOL)requireNamespace
{
  NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
  [container enumerateKeysAndObjectsUsingBlock:^(NSString *key, id object, BOOL *stop) {
    // if we have an FBSDKShareOpenGraphObject and a type, then we are creating a new object instance; set the flag
    if ([key isEqualToString:@"og:type"] && [container isKindOfClass:[FBSDKShareOpenGraphObject class]]) {
      dictionary[@"fbsdk:create_object"] = @YES;
      dictionary[key] = object;
    }
    id value = [self _convertObject:object];
    if (value) {
      NSString *namespace;
      key = [self getOpenGraphNameAndNamespaceFromFullName:key namespace:&namespace];

      if (requireNamespace) {
        if ([namespace isEqualToString:@"og"]) {
          dictionary[key] = value;
        } else {
          data[key] = value;
        }
      } else {
        dictionary[key] = value;
      }
    }
  }];
  if ([data count]) {
    dictionary[@"data"] = data;
  }
  return dictionary;
}

+ (NSString *)getOpenGraphNameAndNamespaceFromFullName:(NSString *)fullName namespace:(NSString **)namespace {
  if (namespace) {
    *namespace = nil;
  }

  if ([fullName isEqualToString:@"fb:explicitly_shared"]) {
    return fullName;
  }

  NSUInteger index = [fullName rangeOfString:@":"].location;
  if ((index != NSNotFound) && (fullName.length > index + 1)) {
    if (namespace) {
      *namespace = [fullName substringToIndex:index];
    }

    return [fullName substringFromIndex:index + 1];
  }

  return fullName;
}

+ (NSDictionary *)_convertPhoto:(FBSDKSharePhoto *)photo
{
  if (!photo) {
    return nil;
  }
  NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];
  dictionary[@"user_generated"] = @(photo.userGenerated);
  [FBSDKInternalUtility dictionary:dictionary setObject:photo.caption forKey:@"caption"];

  [FBSDKInternalUtility dictionary:dictionary setObject:photo.image ?: photo.imageURL.absoluteString forKey:@"url"];
  return dictionary;
}

+ (BOOL)_isOpenGraphValue:(id)value
{
  return ((value == nil) ||
          [value isKindOfClass:[NSNull class]] ||
          [value isKindOfClass:[NSNumber class]] ||
          [value isKindOfClass:[NSString class]] ||
          [value isKindOfClass:[NSURL class]] ||
          [value isKindOfClass:[FBSDKSharePhoto class]] ||
          [value isKindOfClass:[FBSDKShareOpenGraphObject class]]);
}

+ (void)_stageImagesForPhotoContent:(FBSDKSharePhotoContent *)content
              withCompletionHandler:(void(^)(NSArray<NSString *> *))completion
{
  __block NSMutableArray<NSString *> *stagedURIs = [NSMutableArray array];
  dispatch_group_t group = dispatch_group_create();
  for (FBSDKSharePhoto *photo in content.photos) {
    if (photo.image != nil) {
      dispatch_group_enter(group);
      NSDictionary *stagingParameters = @{
                                          @"file" : photo.image,
                                          };
      FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me/staging_resources"
                                                                     parameters:stagingParameters
                                                                     HTTPMethod:@"POST"];
      [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
        NSString *photoStagedURI = result[@"uri"];
        if (photoStagedURI != nil) {
          [stagedURIs addObject:photoStagedURI];
          dispatch_group_leave(group);
        }
      }];
    }
  }

  dispatch_group_notify(group, dispatch_get_main_queue(), ^{
    if (completion != NULL) {
      completion([stagedURIs copy]);
    }
  });
}

+ (void)_testObject:(id)object containsMedia:(BOOL *)containsMediaRef containsPhotos:(BOOL *)containsPhotosRef containsVideos:(BOOL *)containsVideosRef
{
  BOOL containsMedia = NO;
  BOOL containsPhotos = NO;
  BOOL containsVideos = NO;
  if ([object isKindOfClass:[FBSDKSharePhoto class]]) {
    containsMedia = (((FBSDKSharePhoto *)object).image != nil);
    containsPhotos = YES;
  } else if ([object isKindOfClass:[FBSDKShareVideo class]]) {
    containsMedia = YES;
    containsVideos = YES;
  } else if ([object isKindOfClass:[FBSDKShareOpenGraphValueContainer class]]) {
    [self _testOpenGraphValueContainer:(FBSDKShareOpenGraphValueContainer *)object
                         containsMedia:&containsMedia
                        containsPhotos:&containsPhotos
                        containsVideos:&containsVideos];
  } else if ([object isKindOfClass:[NSArray class]]) {
    for (id item in (NSArray *)object) {
      BOOL itemContainsMedia = NO;
      BOOL itemContainsPhotos = NO;
      BOOL itemContainsVideos = NO;
      [self _testObject:item containsMedia:&itemContainsMedia containsPhotos:&itemContainsPhotos containsVideos:&itemContainsVideos];
      containsMedia |= itemContainsMedia;
      containsPhotos |= itemContainsPhotos;
      containsVideos |= itemContainsVideos;
      if (containsMedia && containsPhotos && containsVideos) {
        break;
      }
    }
  }
  if (containsMediaRef != NULL) {
    *containsMediaRef = containsMedia;
  }
  if (containsPhotosRef != NULL) {
    *containsPhotosRef = containsPhotos;
  }
  if (containsVideosRef != NULL) {
    *containsVideosRef = containsVideos;
  }
}

+ (void)_testOpenGraphValueContainer:(FBSDKShareOpenGraphValueContainer *)container
                       containsMedia:(BOOL *)containsMediaRef
                      containsPhotos:(BOOL *)containsPhotosRef
                      containsVideos:(BOOL *)containsVideosRef
{
  __block BOOL containsMedia = NO;
  __block BOOL containsPhotos = NO;
  __block BOOL containsVideos = NO;
  [container enumerateKeysAndObjectsUsingBlock:^(NSString *key, id object, BOOL *stop) {
    BOOL itemContainsMedia = NO;
    BOOL itemContainsPhotos = NO;
    BOOL itemContainsVideos = NO;
    [self _testObject:object containsMedia:&itemContainsMedia containsPhotos:&itemContainsPhotos containsVideos:&itemContainsVideos];
    containsMedia |= itemContainsMedia;
    containsPhotos |= itemContainsPhotos;
    containsVideos |= itemContainsVideos;
    if (containsMedia && containsPhotos && containsVideosRef) {
      *stop = YES;
    }
  }];
  if (containsMediaRef != NULL) {
    *containsMediaRef = containsMedia;
  }
  if (containsPhotosRef != NULL) {
    *containsPhotosRef = containsPhotos;
  }
  if (containsVideosRef != NULL) {
    *containsVideosRef = containsVideos;
  }
}

+ (BOOL)_validateArray:(NSArray *)array
              minCount:(NSUInteger)minCount
              maxCount:(NSUInteger)maxCount
                  name:(NSString *)name
                 error:(NSError *__autoreleasing *)errorRef
{
  NSUInteger count = [array count];
  if ((count < minCount) || (count > maxCount)) {
    if (errorRef != NULL) {
      NSString *message = [[NSString alloc] initWithFormat:@"%@ must have %lu to %lu values",
                           name,
                           (unsigned long)minCount,
                           (unsigned long)maxCount];
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:name value:array message:message];
    }
    return NO;
  } else {
    if (errorRef != NULL) {
      *errorRef = nil;
    }
    return YES;
  }
}

+ (BOOL)_validateFileURL:(NSURL *)URL name:(NSString *)name error:(NSError *__autoreleasing *)errorRef
{
  if (!URL) {
    if (errorRef != NULL) {
      *errorRef = nil;
    }
    return YES;
  }
  if (!URL.isFileURL) {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:name value:URL message:nil];
    }
    return NO;
  }
  // ensure that the file exists.  per the latest spec for NSFileManager, we should not be checking for file existence,
  // so they have removed that option for URLs and discourage it for paths, so we just construct a mapped NSData.
  NSError *fileError;
  if (![[NSData alloc] initWithContentsOfURL:URL
                                     options:NSDataReadingMapped
                                       error:&fileError]) {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:name
                                                          value:URL
                                                        message:@"Error reading file"
                                                underlyingError:fileError];
    }
    return NO;
  }
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  return YES;
}

+ (BOOL)_validateNetworkURL:(NSURL *)URL name:(NSString *)name error:(NSError *__autoreleasing *)errorRef
{
  if (!URL || [FBSDKInternalUtility isBrowserURL:URL]) {
    if (errorRef != NULL) {
      *errorRef = nil;
    }
    return YES;
  } else {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:name value:URL message:nil];
    }
    return NO;
  }
}

+ (BOOL)_validateRequiredValue:(id)value name:(NSString *)name error:(NSError *__autoreleasing *)errorRef
{
  if (!value ||
      ([value isKindOfClass:[NSString class]] && ![(NSString *)value length]) ||
      ([value isKindOfClass:[NSArray class]] && ![(NSArray *)value count]) ||
      ([value isKindOfClass:[NSDictionary class]] && ![(NSDictionary *)value count])) {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError requiredArgumentErrorWithName:name message:nil];
    }
    return NO;
  }
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  return YES;
}

+ (BOOL)_validateArgumentWithName:(NSString *)argumentName
                            value:(NSUInteger)value
                             isIn:(NSArray *)possibleValues
                            error:(NSError *__autoreleasing *)errorRef
{
  for (NSNumber *possibleValue in possibleValues) {
    if (value == [possibleValue unsignedIntegerValue]) {
      if (errorRef != NULL) {
        *errorRef = nil;
      }
      return YES;
    }
  }
  if (errorRef != NULL) {
    *errorRef = [FBSDKShareError invalidArgumentErrorWithName:argumentName value:@(value) message:nil];
  }
  return NO;
}

+ (BOOL)_validateAssetLibraryVideoURL:(NSURL *)videoURL name:(NSString *)name error:(NSError *__autoreleasing *)errorRef
{
  if (!videoURL || [[videoURL.scheme lowercaseString] isEqualToString:@"assets-library"]) {
    if (errorRef != NULL) {
      *errorRef = nil;
    }
    return YES;
  } else {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:name value:videoURL message:nil];
    }
    return NO;
  }
}

@end
