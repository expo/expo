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

#import "FBSDKLikeActionController.h"

#import <QuartzCore/QuartzCore.h>

#import <FBSDKCoreKit/FBSDKCoreKit.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKLikeActionControllerCache.h"
#import "FBSDKLikeButtonPopWAV.h"
#import "FBSDKLikeDialog.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

NSNotificationName const FBSDKLikeActionControllerDidDisableNotification = @"FBSDKLikeActionControllerDidDisableNotification";
NSNotificationName const FBSDKLikeActionControllerDidResetNotification = @"FBSDKLikeActionControllerDidResetNotification";
NSNotificationName const FBSDKLikeActionControllerDidUpdateNotification = @"FBSDKLikeActionControllerDidUpdateNotification";

#else

NSString *const FBSDKLikeActionControllerDidDisableNotification = @"FBSDKLikeActionControllerDidDisableNotification";
NSString *const FBSDKLikeActionControllerDidResetNotification = @"FBSDKLikeActionControllerDidResetNotification";
NSString *const FBSDKLikeActionControllerDidUpdateNotification = @"FBSDKLikeActionControllerDidUpdateNotification";

#endif

NSString *const FBSDKLikeActionControllerAnimatedKey = @"animated";

#define FBSDK_LIKE_ACTION_CONTROLLER_ANIMATION_DELAY 0.5
#define FBSDK_LIKE_ACTION_CONTROLLER_SOUND_DELAY 0.15
#define FBSDK_LIKE_ACTION_CONTROLLER_API_VERSION @"v2.1"

#define FBSDK_LIKE_ACTION_CONTROLLER_LIKE_PROPERTY_KEY @"like"
#define FBSDK_LIKE_ACTION_CONTROLLER_REFRESH_PROPERTY_KEY @"refresh"

#define FBSDK_LIKE_ACTION_CONTROLLER_LAST_UPDATE_TIME_KEY @"lastUpdateTime"
#define FBSDK_LIKE_ACTION_CONTROLLER_LIKE_COUNT_STRING_WITH_LIKE_KEY @"likeCountStringWithLike"
#define FBSDK_LIKE_ACTION_CONTROLLER_LIKE_COUNT_STRING_WITHOUT_LIKE_KEY @"likeCountStringWithoutLike"
#define FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_ID_KEY @"objectID"
#define FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_IS_LIKED_KEY @"objectIsLiked"
#define FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_TYPE_KEY @"objectType"
#define FBSDK_LIKE_ACTION_CONTROLLER_SOCIAL_SENTENCE_WITH_LIKE_KEY @"socialSentenceWithLike"
#define FBSDK_LIKE_ACTION_CONTROLLER_SOCIAL_SENTENCE_WITHOUT_LIKE_KEY @"socialSentenceWithoutLike"
#define FBSDK_LIKE_ACTION_CONTROLLER_UNLIKE_TOKEN_KEY @"unlikeToken"
#define FBSDK_LIKE_ACTION_CONTROLLER_VERSION_KEY @"version"

#define FBSDK_LIKE_ACTION_CONTROLLER_VERSION 4

typedef NS_ENUM(NSUInteger, FBSDKLikeActionControllerRefreshMode)
{
  FBSDKLikeActionControllerRefreshModeInitial,
  FBSDKLikeActionControllerRefreshModeForce,
};

typedef NS_ENUM(NSUInteger, FBSDKLikeActionControllerRefreshState)
{
  FBSDKLikeActionControllerRefreshStateNone,
  FBSDKLikeActionControllerRefreshStateActive,
  FBSDKLikeActionControllerRefreshStateComplete,
};

typedef void(^fbsdk_like_action_block)(FBSDKTriStateBOOL objectIsLiked,
                                       NSString *likeCountStringWithLike,
                                       NSString *likeCountStringWithoutLike,
                                       NSString *socialSentenceWithLike,
                                       NSString *socialSentenceWithoutLike,
                                       NSString *unlikeToken,
                                       BOOL likeStateChanged,
                                       BOOL animated);

typedef void(^fbsdk_like_action_controller_ensure_verified_object_id_completion_block)(NSString *verifiedObjectID);

@interface FBSDKLikeActionController () <FBSDKLikeDialogDelegate>
@end

@implementation FBSDKLikeActionController
{
  FBSDKAccessToken *_accessToken;
  NSUInteger _contentAccessCount;
  BOOL _contentDiscarded;
  NSMapTable *_dialogToAnalyticsParametersMap;
  NSMapTable *_dialogToUpdateBlockMap;
  NSString *_likeCountStringWithLike;
  NSString *_likeCountStringWithoutLike;
  BOOL _objectIsLikedIsPending;
  BOOL _objectIsLikedOnServer;
  BOOL _objectIsPage;
  FBSDKLikeActionControllerRefreshState _refreshState;
  NSString *_socialSentenceWithLike;
  NSString *_socialSentenceWithoutLike;
  NSString *_unlikeToken;
  NSString *_verifiedObjectID;
}

#pragma mark - Class Methods

static BOOL _fbsdkLikeActionControllerDisabled = YES;

+ (BOOL)isDisabled
{
  return _fbsdkLikeActionControllerDisabled;
}

static FBSDKLikeActionControllerCache *_cache = nil;

+ (void)initialize
{
  if (self == [FBSDKLikeActionController class]) {
    NSString *accessTokenString = [FBSDKAccessToken currentAccessToken].tokenString;
    if (accessTokenString) {
      NSURL *fileURL = [self _cacheFileURL];
      NSData *data = [[NSData alloc] initWithContentsOfURL:fileURL];
      if (data) {
        NSKeyedUnarchiver *unarchiver = [[NSKeyedUnarchiver alloc] initForReadingWithData:data];
        unarchiver.requiresSecureCoding = YES;
        @try {
          _cache = [unarchiver decodeObjectOfClass:[FBSDKLikeActionControllerCache class]
                                            forKey:NSKeyedArchiveRootObjectKey];
        }
        @catch (NSException *ex) {
          // ignore decoding exceptions from previous versions of the archive, etc
        }
        if (![_cache.accessTokenString isEqualToString:accessTokenString]) {
          _cache = nil;
        }
      }
    }
    if (!_cache) {
      _cache = [[FBSDKLikeActionControllerCache alloc] initWithAccessTokenString:accessTokenString];
    }
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
    [nc addObserver:self
           selector:@selector(_accessTokenDidChangeNotification:)
               name:FBSDKAccessTokenDidChangeNotification
             object:nil];
    [nc addObserver:self
           selector:@selector(_applicationWillResignActiveNotification:)
               name:UIApplicationWillResignActiveNotification
             object:nil];
  }
}

+ (void)_accessTokenDidChangeNotification:(NSNotification *)notification
{
  NSString *accessTokenString = [FBSDKAccessToken currentAccessToken].tokenString;
  if ([accessTokenString isEqualToString:_cache.accessTokenString]) {
    return;
  }
  [_cache resetForAccessTokenString:accessTokenString];
  [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKLikeActionControllerDidResetNotification object:nil];
}

+ (void)_applicationWillResignActiveNotification:(NSNotification *)notification
{
  NSURL *fileURL = [self _cacheFileURL];
  if (!fileURL) {
    return;
  }
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:_cache];
  if (data) {
    [data writeToURL:fileURL atomically:YES];
  } else {
    [[[NSFileManager alloc] init] removeItemAtURL:fileURL error:NULL];
  }
}

+ (NSURL *)_cacheFileURL
{
  NSURL *directoryURL = [[[NSFileManager alloc] init] URLForDirectory:NSLibraryDirectory
                                                             inDomain:NSUserDomainMask
                                                    appropriateForURL:nil
                                                               create:YES
                                                                error:NULL];
  return [directoryURL URLByAppendingPathComponent:@"com-facebook-sdk-like-data"];
}


+ (instancetype)likeActionControllerForObjectID:(NSString *)objectID objectType:(FBSDKLikeObjectType)objectType
{
  if (!objectID) {
    return nil;
  }
  @synchronized(self) {
    FBSDKLikeActionController *controller = _cache[objectID];
    FBSDKAccessToken *accessToken = [FBSDKAccessToken currentAccessToken];
    if (controller) {
      [controller beginContentAccess];
    } else {
      controller = [[self alloc] initWithObjectID:objectID objectType:objectType accessToken:accessToken];
      _cache[objectID] = controller;
    }
    [controller _refreshWithMode:FBSDKLikeActionControllerRefreshModeInitial];
    return controller;
  }
}

#pragma mark - Object Lifecycle

- (instancetype)initWithObjectID:(NSString *)objectID
                      objectType:(FBSDKLikeObjectType)objectType
                     accessToken:(FBSDKAccessToken *)accessToken
{
  if ((self = [super init])) {
    _objectID = [objectID copy];
    _objectType = objectType;
    _accessToken = [accessToken copy];

    [self _configure];
  }
  return self;
}

- (instancetype)init
{
  return [self initWithObjectID:nil objectType:FBSDKLikeObjectTypeUnknown accessToken:nil];
}

#pragma mark - NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder
{
  if ([decoder decodeIntegerForKey:FBSDK_LIKE_ACTION_CONTROLLER_VERSION_KEY] != FBSDK_LIKE_ACTION_CONTROLLER_VERSION) {
    return nil;
  }

  NSString *objectID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_ID_KEY];
  if (!objectID) {
    return nil;
  }

  if ((self = [super init])) {
    _objectID = [objectID copy];
    _accessToken = [FBSDKAccessToken currentAccessToken];

    _lastUpdateTime = [[decoder decodeObjectOfClass:[NSDate class] forKey:FBSDK_LIKE_ACTION_CONTROLLER_LAST_UPDATE_TIME_KEY] copy];
    _likeCountStringWithLike = [[decoder decodeObjectOfClass:[NSString class]
                                                      forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_COUNT_STRING_WITH_LIKE_KEY] copy];
    _likeCountStringWithoutLike = [[decoder decodeObjectOfClass:[NSString class]
                                                         forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_COUNT_STRING_WITHOUT_LIKE_KEY] copy];
    _objectIsLiked = [decoder decodeBoolForKey:FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_IS_LIKED_KEY];
    _objectType = [decoder decodeIntegerForKey:FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_TYPE_KEY];
    _socialSentenceWithLike = [[decoder decodeObjectOfClass:[NSString class]
                                                     forKey:FBSDK_LIKE_ACTION_CONTROLLER_SOCIAL_SENTENCE_WITH_LIKE_KEY] copy];
    _socialSentenceWithoutLike = [[decoder decodeObjectOfClass:[NSString class]
                                                        forKey:FBSDK_LIKE_ACTION_CONTROLLER_SOCIAL_SENTENCE_WITHOUT_LIKE_KEY] copy];
    _unlikeToken = [[decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_LIKE_ACTION_CONTROLLER_UNLIKE_TOKEN_KEY] copy];

    [self _configure];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)coder
{
  [coder encodeObject:_lastUpdateTime forKey:FBSDK_LIKE_ACTION_CONTROLLER_LAST_UPDATE_TIME_KEY];
  [coder encodeObject:_likeCountStringWithLike forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_COUNT_STRING_WITH_LIKE_KEY];
  [coder encodeObject:_likeCountStringWithoutLike
               forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_COUNT_STRING_WITHOUT_LIKE_KEY];
  [coder encodeObject:_objectID forKey:FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_ID_KEY];
  [coder encodeBool:_objectIsLiked forKey:FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_IS_LIKED_KEY];
  [coder encodeInteger:_objectType forKey:FBSDK_LIKE_ACTION_CONTROLLER_OBJECT_TYPE_KEY];
  [coder encodeObject:_socialSentenceWithLike forKey:FBSDK_LIKE_ACTION_CONTROLLER_SOCIAL_SENTENCE_WITH_LIKE_KEY];
  [coder encodeObject:_socialSentenceWithoutLike forKey:FBSDK_LIKE_ACTION_CONTROLLER_SOCIAL_SENTENCE_WITHOUT_LIKE_KEY];
  [coder encodeObject:_unlikeToken forKey:FBSDK_LIKE_ACTION_CONTROLLER_UNLIKE_TOKEN_KEY];
  [coder encodeInteger:FBSDK_LIKE_ACTION_CONTROLLER_VERSION forKey:FBSDK_LIKE_ACTION_CONTROLLER_VERSION_KEY];
}

#pragma mark - Properties

- (NSString *)likeCountString
{
  return (_objectIsLiked ? _likeCountStringWithLike : _likeCountStringWithoutLike);
}

- (NSString *)socialSentence
{
  return (_objectIsLiked ? _socialSentenceWithLike : _socialSentenceWithoutLike);
}

#pragma mark - Public API

- (void)refresh
{
  [self _refreshWithMode:FBSDKLikeActionControllerRefreshModeForce];
}

- (void)toggleLikeWithSoundEnabled:(BOOL)soundEnabled analyticsParameters:(NSDictionary *)analyticsParameters fromViewController:(UIViewController *)fromViewController
{
  [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKLikeControlDidTap
                        valueToSum:nil
                        parameters:analyticsParameters
                       accessToken:_accessToken];

  [self _setExecuting:YES forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_PROPERTY_KEY];

  BOOL useOGLike = [self _useOGLike];
  BOOL deferred = !useOGLike;

  fbsdk_like_action_block updateBlock = ^(FBSDKTriStateBOOL objectIsLiked,
                                          NSString *likeCountStringWithLike,
                                          NSString *likeCountStringWithoutLike,
                                          NSString *socialSentenceWithLike,
                                          NSString *socialSentenceWithoutLike,
                                          NSString *unlikeToken,
                                          BOOL likeStateChanged,
                                          BOOL animated){
    [self _updateWithObjectIsLiked:objectIsLiked
           likeCountStringWithLike:likeCountStringWithLike
        likeCountStringWithoutLike:likeCountStringWithoutLike
            socialSentenceWithLike:socialSentenceWithLike
         socialSentenceWithoutLike:socialSentenceWithoutLike
                       unlikeToken:unlikeToken
                      soundEnabled:soundEnabled && likeStateChanged
                          animated:animated && likeStateChanged
                          deferred:deferred];
  };

  BOOL objectIsLiked = !_objectIsLiked;

  // optimistically update if using og.like (FAS will defer the update)
  if (useOGLike) {
    updateBlock(FBSDKTriStateBOOLFromBOOL(objectIsLiked),
                _likeCountStringWithLike,
                _likeCountStringWithoutLike,
                _socialSentenceWithLike,
                _socialSentenceWithoutLike,
                _unlikeToken,
                YES,
                YES);
    if (_objectIsLikedIsPending) {
      return;
    }
  }

  if (objectIsLiked) {
    if (useOGLike) {
      [self _publishLikeWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    } else {
      [self _presentLikeDialogWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    }
  } else {
    if (useOGLike && _unlikeToken) {
      [self _publishUnlikeWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    } else {
      [self _presentLikeDialogWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    }
  }
}

#pragma mark - NSDiscardableContent

- (BOOL)beginContentAccess
{
  _contentDiscarded = NO;
  _contentAccessCount++;
  return YES;
}

- (void)endContentAccess
{
  _contentAccessCount--;
}

- (void)discardContentIfPossible
{
  if (_contentAccessCount == 0) {
    _contentDiscarded = YES;
  }
}

- (BOOL)isContentDiscarded
{
  return _contentDiscarded;
}

#pragma mark - FBSDKLikeDialogDelegate

- (void)likeDialog:(FBSDKLikeDialog *)likeDialog didCompleteWithResults:(NSDictionary *)results
{
  FBSDKTriStateBOOL objectIsLiked = FBSDKTriStateBOOLFromNSNumber(results[@"object_is_liked"]);
  NSString *likeCountString = [FBSDKTypeUtility stringValue:results[@"like_count_string"]];
  NSString *socialSentence = [FBSDKTypeUtility stringValue:results[@"social_sentence"]];
  NSString *unlikeToken = [FBSDKTypeUtility stringValue:results[@"unlike_token"]];
  BOOL likeStateChanged = ![[FBSDKTypeUtility stringValue:results[@"completionGesture"]] isEqualToString:@"cancel"];

  fbsdk_like_action_block updateBlock = [_dialogToUpdateBlockMap objectForKey:likeDialog];
  if (updateBlock != NULL) {
    // we do not need to specify values for with/without like, since we will fast-app-switch to change
    // the value
    updateBlock(objectIsLiked,
                likeCountString,
                likeCountString,
                socialSentence,
                socialSentence,
                unlikeToken,
                likeStateChanged,
                YES);
  }
  [self _setExecuting:NO forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_PROPERTY_KEY];
}

- (void)likeDialog:(FBSDKLikeDialog *)likeDialog didFailWithError:(NSError *)error
{
  [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorUIControlErrors
                     formatString:@"Like dialog error for %@(%@): %@", _objectID, NSStringFromFBSDKLikeObjectType(_objectType), error];

  if ([error.userInfo[@"error_reason"] isEqualToString:@"dialog_disabled"]) {
    _fbsdkLikeActionControllerDisabled = YES;

    [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKLikeControlDidDisable
                          valueToSum:nil
                          parameters:[_dialogToAnalyticsParametersMap objectForKey:likeDialog]
                         accessToken:_accessToken];

    [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKLikeActionControllerDidDisableNotification
                                                        object:self
                                                      userInfo:nil];
  } else {
    FBSDKLikeActionControllerLogError(@"present_dialog", _objectID, _objectType, _accessToken, error);
  }
  [self _setExecuting:NO forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_PROPERTY_KEY];
}

#pragma mark - Helper Methods

- (void)_configure
{
  NSPointerFunctionsOptions keyOptions = (NSPointerFunctionsStrongMemory | NSPointerFunctionsObjectPersonality);
  NSPointerFunctionsOptions valueOptions = (NSPointerFunctionsStrongMemory |
                                            NSPointerFunctionsObjectPersonality |
                                            NSPointerFunctionsCopyIn);
  _dialogToAnalyticsParametersMap = [[NSMapTable alloc] initWithKeyOptions:keyOptions valueOptions:valueOptions capacity:0];
  _dialogToUpdateBlockMap = [[NSMapTable alloc] initWithKeyOptions:keyOptions valueOptions:valueOptions capacity:0];

  _contentAccessCount = 1;
}

static void FBSDKLikeActionControllerLogError(NSString *currentAction,
                                              NSString *objectID,
                                              FBSDKLikeObjectType objectType,
                                              FBSDKAccessToken *accessToken,
                                              NSError *error)
{
  NSDictionary *parameters = @{
                               @"object_id": objectID,
                               @"object_type": NSStringFromFBSDKLikeObjectType(objectType),
                               @"current_action": currentAction,
                               @"error": error.description ?: @"",
                               };
  NSString *eventName = (error.isNetworkError ?
                         FBSDKAppEventNameFBSDKLikeControlNetworkUnavailable :
                         FBSDKAppEventNameFBSDKLikeControlError);
  [FBSDKAppEvents logImplicitEvent:eventName
                        valueToSum:nil
                        parameters:parameters
                       accessToken:accessToken];
}

typedef void(^fbsdk_like_action_controller_get_engagement_completion_block)(BOOL success,
                                                                            NSString *likeCountStringWithLike,
                                                                            NSString *likeCountStringWithoutLike,
                                                                            NSString *socialSentenceWithLike,
                                                                            NSString *socialSentenceWithoutLike);
static void FBSDKLikeActionControllerAddGetEngagementRequest(FBSDKAccessToken *accessToken,
                                                             FBSDKGraphRequestConnection *connection,
                                                             NSString *objectID,
                                                             FBSDKLikeObjectType objectType,
                                                             fbsdk_like_action_controller_get_engagement_completion_block completionHandler)
{
  if (completionHandler == NULL) {
    return;
  }
  NSString *fields = @"engagement.fields(count_string_with_like,count_string_without_like,social_sentence_with_like,"
  @"social_sentence_without_like)";
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:objectID
                                                                 parameters:@{ @"fields": fields,
                                                                               @"locale": [NSLocale currentLocale].localeIdentifier
                                                                               }
                                                                tokenString:accessToken.tokenString
                                                                 HTTPMethod:@"GET"
                                                                      flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];
  [connection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    BOOL success = NO;
    NSString *likeCountStringWithLike = nil;
    NSString *likeCountStringWithoutLike = nil;
    NSString *socialSentenceWithLike = nil;
    NSString *socialSentenceWithoutLike = nil;
    if (error) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorUIControlErrors
                         formatString:@"Error fetching engagement for %@ (%@): %@",
       objectID,
       NSStringFromFBSDKLikeObjectType(objectType),
       error];
      FBSDKLikeActionControllerLogError(@"get_engagement", objectID, objectType, accessToken, error);
    } else {
      success = YES;
      result = [FBSDKTypeUtility dictionaryValue:result];
      likeCountStringWithLike = [FBSDKTypeUtility stringValue:[result valueForKeyPath:@"engagement.count_string_with_like"]];
      likeCountStringWithoutLike = [FBSDKTypeUtility stringValue:[result valueForKeyPath:@"engagement.count_string_without_like"]];
      socialSentenceWithLike = [FBSDKTypeUtility stringValue:[result valueForKeyPath:@"engagement.social_sentence_with_like"]];
      socialSentenceWithoutLike = [FBSDKTypeUtility stringValue:[result valueForKeyPath:@"engagement.social_sentence_without_like"]];
    }
    completionHandler(success,
                      likeCountStringWithLike,
                      likeCountStringWithoutLike,
                      socialSentenceWithLike,
                      socialSentenceWithoutLike);
  }];
}

typedef void(^fbsdk_like_action_controller_get_object_id_completion_block)(BOOL success,
                                                                           NSString *verifiedObjectID,
                                                                           BOOL objectIsPage);
static void FBSDKLikeActionControllerAddGetObjectIDRequest(FBSDKAccessToken *accessToken,
                                                           FBSDKGraphRequestConnection *connection,
                                                           NSString *objectID,
                                                           fbsdk_like_action_controller_get_object_id_completion_block completionHandler)
{
  if (completionHandler == NULL) {
    return;
  }
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:@""
                                                                 parameters:@{
                                                                              @"fields": @"id",
                                                                              @"id": objectID,
                                                                              @"metadata": @"1",
                                                                              @"type": @"og",
                                                                              @"locale": [NSLocale currentLocale].localeIdentifier
                                                                              }
                                                                tokenString:accessToken.tokenString
                                                                 HTTPMethod:@"GET"
                                                                      flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    result = [FBSDKTypeUtility dictionaryValue:result];
    NSString *verifiedObjectID = [FBSDKTypeUtility stringValue:result[@"id"]];
    BOOL objectIsPage = [FBSDKTypeUtility boolValue:[result valueForKeyPath:@"metadata.type"]];
    completionHandler(verifiedObjectID != nil, verifiedObjectID, objectIsPage);
  }];
}

static void FBSDKLikeActionControllerAddGetObjectIDWithObjectURLRequest(FBSDKAccessToken *accessToken,
                                                                        FBSDKGraphRequestConnection *connection,
                                                                        NSString *objectID,
                                                                        fbsdk_like_action_controller_get_object_id_completion_block completionHandler)
{
  if (completionHandler == NULL) {
    return;
  }
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:@""
                                                                 parameters:@{
                                                                              @"fields": @"og_object.fields(id)",
                                                                              @"id": objectID,
                                                                              @"locale": [NSLocale currentLocale].localeIdentifier
                                                                              }
                                                                tokenString:accessToken.tokenString
                                                                 HTTPMethod:@"GET"
                                                                      flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];
  [connection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    result = [FBSDKTypeUtility dictionaryValue:result];
    NSString *verifiedObjectID = [FBSDKTypeUtility stringValue:[result valueForKeyPath:@"og_object.id"]];
    completionHandler(verifiedObjectID != nil, verifiedObjectID, NO);
  }];
}

typedef void(^fbsdk_like_action_controller_get_og_object_like_completion_block)(BOOL success,
                                                                                FBSDKTriStateBOOL objectIsLiked,
                                                                                NSString *unlikeToken);
static void FBSDKLikeActionControllerAddGetOGObjectLikeRequest(FBSDKAccessToken *accessToken,
                                                               FBSDKGraphRequestConnection *connection,
                                                               NSString *objectID,
                                                               FBSDKLikeObjectType objectType,
                                                               fbsdk_like_action_controller_get_og_object_like_completion_block completionHandler)
{
  if (completionHandler == NULL) {
    return;
  }
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me/og.likes"
                                                                 parameters:@{
                                                                              @"fields": @"id,application",
                                                                              @"object": objectID,
                                                                              @"locale": [NSLocale currentLocale].localeIdentifier
                                                                              }
                                                                tokenString:accessToken.tokenString
                                                                 HTTPMethod:@"GET"
                                                                      flags:FBSDKGraphRequestFlagDoNotInvalidateTokenOnError | FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    BOOL success = NO;
    FBSDKTriStateBOOL objectIsLiked = FBSDKTriStateBOOLValueUnknown;
    NSString *unlikeToken = nil;
    if (error) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorUIControlErrors
                         formatString:@"Error fetching like state for %@(%@): %@", objectID, NSStringFromFBSDKLikeObjectType(objectType), error];
      FBSDKLikeActionControllerLogError(@"get_og_object_like", objectID, objectType, accessToken, error);
    } else {
      success = YES;
      result = [FBSDKTypeUtility dictionaryValue:result];
      NSArray *dataSet = [FBSDKTypeUtility arrayValue:result[@"data"]];
      for (NSDictionary *data in dataSet) {
        objectIsLiked = FBSDKTriStateBOOLValueYES;
        NSString *applicationID = [FBSDKTypeUtility stringValue:[data valueForKeyPath:@"application.id"]];
        if ([accessToken.appID isEqualToString:applicationID]) {
          unlikeToken = [FBSDKTypeUtility stringValue:data[@"id"]];
          break;
        }
      }
    }
    completionHandler(success, objectIsLiked, unlikeToken);
  }];
}

typedef void(^fbsdk_like_action_controller_publish_like_completion_block)(BOOL success, NSString *unlikeToken);
static void FBSDKLikeActionControllerAddPublishLikeRequest(FBSDKAccessToken *accessToken,
                                                           FBSDKGraphRequestConnection *connection,
                                                           NSString *objectID,
                                                           FBSDKLikeObjectType objectType,
                                                           fbsdk_like_action_controller_publish_like_completion_block completionHandler)
{
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me/og.likes"
                                                                 parameters:@{ @"object": objectID,
                                                                               @"locale": [NSLocale currentLocale].localeIdentifier
                                                                               }
                                                                tokenString:accessToken.tokenString
                                                                    version:nil
                                                                 HTTPMethod:@"POST"];
  [connection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    BOOL success = NO;
    NSString *unlikeToken = nil;
    if (error) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorUIControlErrors
                         formatString:@"Error liking object %@(%@): %@", objectID, NSStringFromFBSDKLikeObjectType(objectType), error];
      FBSDKLikeActionControllerLogError(@"publish_like", objectID, objectType, accessToken, error);
    } else {
      success = YES;
      result = [FBSDKTypeUtility dictionaryValue:result];
      unlikeToken = [FBSDKTypeUtility stringValue:result[@"id"]];
    }
    if (completionHandler != NULL) {
      completionHandler(success, unlikeToken);
    }
  }];
}

typedef void(^fbsdk_like_action_controller_publish_unlike_completion_block)(BOOL success);
static void FBSDKLikeActionControllerAddPublishUnlikeRequest(FBSDKAccessToken *accessToken,
                                                             FBSDKGraphRequestConnection *connection,
                                                             NSString *unlikeToken,
                                                             FBSDKLikeObjectType objectType,
                                                             fbsdk_like_action_controller_publish_unlike_completion_block completionHandler)
{
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:unlikeToken
                                                                 parameters:nil
                                                                tokenString:accessToken.tokenString
                                                                    version:nil
                                                                 HTTPMethod:@"DELETE"];
  [connection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    BOOL success = NO;
    if (error) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorUIControlErrors
                         formatString:@"Error unliking object with unlike token %@(%@): %@", unlikeToken, NSStringFromFBSDKLikeObjectType(objectType), error];
      FBSDKLikeActionControllerLogError(@"publish_unlike", unlikeToken, objectType, accessToken, error);
    } else {
      success = YES;
    }
    if (completionHandler != NULL) {
      completionHandler(success);
    }
  }];
}

static void FBSDKLikeActionControllerAddRefreshRequests(FBSDKAccessToken *accessToken,
                                                        FBSDKGraphRequestConnection *connection,
                                                        NSString *objectID,
                                                        FBSDKLikeObjectType objectType,
                                                        fbsdk_like_action_block completionHandler)
{
  if (completionHandler == NULL) {
    return;
  }
  __block FBSDKTriStateBOOL objectIsLiked = FBSDKTriStateBOOLValueUnknown;
  __block NSString *likeCountStringWithLike = nil;
  __block NSString *likeCountStringWithoutLike = nil;
  __block NSString *socialSentenceWithLike = nil;
  __block NSString *socialSentenceWithoutLike = nil;
  __block NSString *unlikeToken = nil;

  void(^handleResults)(void) = ^{
    completionHandler(objectIsLiked,
                      likeCountStringWithLike,
                      likeCountStringWithoutLike,
                      socialSentenceWithLike,
                      socialSentenceWithoutLike,
                      unlikeToken,
                      NO,
                      NO);
  };

  fbsdk_like_action_controller_get_og_object_like_completion_block getLikeStateCompletionBlock = ^(BOOL success,
                                                                                                   FBSDKTriStateBOOL innerObjectIsLiked,
                                                                                                   NSString *innerUnlikeToken) {
    if (success) {
      objectIsLiked = innerObjectIsLiked;
      if (innerUnlikeToken) {
        unlikeToken = [innerUnlikeToken copy];
      }
    }
  };
  FBSDKLikeActionControllerAddGetOGObjectLikeRequest(accessToken,
                                                     connection,
                                                     objectID,
                                                     objectType,
                                                     getLikeStateCompletionBlock);

  fbsdk_like_action_controller_get_engagement_completion_block engagementCompletionBlock = ^(BOOL success,
                                                                                             NSString *innerLikeCountStringWithLike,
                                                                                             NSString *innerLikeCountStringWithoutLike,
                                                                                             NSString *innerSocialSentenceWithLike,
                                                                                             NSString *innerSocialSentenceWithoutLike) {
    if (success) {
      // Don't lose cached state if certain properties were not included
      likeCountStringWithLike = [innerLikeCountStringWithLike copy];
      likeCountStringWithoutLike = [innerLikeCountStringWithoutLike copy];
      socialSentenceWithLike = [innerSocialSentenceWithLike copy];
      socialSentenceWithoutLike = [innerSocialSentenceWithoutLike copy];

      handleResults();
    }
  };
  FBSDKLikeActionControllerAddGetEngagementRequest(accessToken,
                                                   connection,
                                                   objectID,
                                                   objectType,
                                                   engagementCompletionBlock);
}


- (void)_ensureVerifiedObjectID:(fbsdk_like_action_controller_ensure_verified_object_id_completion_block)completion
{
  if (completion == NULL) {
    return;
  }
  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
  [connection overrideGraphAPIVersion:FBSDK_LIKE_ACTION_CONTROLLER_API_VERSION];
  if ([_objectID rangeOfString:@"://"].location != NSNotFound) {
    FBSDKLikeActionControllerAddGetObjectIDWithObjectURLRequest(_accessToken, connection, _objectID, ^(BOOL success,
                                                                                                       NSString *innerVerifiedObjectID,
                                                                                                       BOOL innerObjectIsPage) {
      if (success) {
        self->_verifiedObjectID = [innerVerifiedObjectID copy];
        self->_objectIsPage = innerObjectIsPage;
      }
    });
  }

  FBSDKLikeActionControllerAddGetObjectIDRequest(_accessToken, connection, _objectID, ^(BOOL success,
                                                                                        NSString *innerVerifiedObjectID,
                                                                                        BOOL innerObjectIsPage) {
    if (success) {
      // if this was an URL based request, then we want to use the objectID from that request - this value will just
      // be an echo of the URL
      if (!self->_verifiedObjectID) {
        self->_verifiedObjectID = [innerVerifiedObjectID copy];
      }
      self->_objectIsPage = innerObjectIsPage;
    }
    if (self->_verifiedObjectID) {
      completion(self->_verifiedObjectID);
    }
  });
  [connection start];
}

- (void)_presentLikeDialogWithUpdateBlock:(fbsdk_like_action_block)updateBlock
                      analyticsParameters:(NSDictionary *)analyticsParameters
                       fromViewController:(UIViewController *)fromViewController
{
  [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKLikeControlDidPresentDialog
                        valueToSum:nil
                        parameters:analyticsParameters
                       accessToken:_accessToken];
  FBSDKLikeDialog *dialog = [[FBSDKLikeDialog alloc] init];
  dialog.objectID = _objectID;
  dialog.objectType = _objectType;
  dialog.delegate = self;
  dialog.fromViewController = fromViewController;
  [_dialogToUpdateBlockMap setObject:updateBlock forKey:dialog];
  [_dialogToAnalyticsParametersMap setObject:analyticsParameters forKey:dialog];
  if (![dialog like]) {
    [self _setExecuting:NO forKey:FBSDK_LIKE_ACTION_CONTROLLER_LIKE_PROPERTY_KEY];
  }
}

- (void)_publishIfNeededWithUpdateBlock:(fbsdk_like_action_block)updateBlock
                    analyticsParameters:(NSDictionary *)analyticsParameters
                     fromViewController:(UIViewController *)fromViewController
{
  BOOL objectIsLiked = _objectIsLiked;
  if (_objectIsLikedOnServer != objectIsLiked) {
    if (objectIsLiked) {
      [self _publishLikeWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    } else {
      [self _publishUnlikeWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    }
  }
}

- (void)_publishLikeWithUpdateBlock:(fbsdk_like_action_block)updateBlock
                analyticsParameters:(NSDictionary *)analyticsParameters
                 fromViewController:(UIViewController *)fromViewController
{
  _objectIsLikedIsPending = YES;
  [self _ensureVerifiedObjectID:^(NSString *verifiedObjectID) {
    FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
    [connection overrideGraphAPIVersion:FBSDK_LIKE_ACTION_CONTROLLER_API_VERSION];
    fbsdk_like_action_controller_publish_like_completion_block completionHandler = ^(BOOL success,
                                                                                     NSString *unlikeToken) {
      self->_objectIsLikedIsPending = NO;
      if (success) {
        [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKLikeControlDidLike
                              valueToSum:nil
                              parameters:analyticsParameters
                             accessToken:self->_accessToken];
        self->_objectIsLikedOnServer = YES;
        self->_unlikeToken = [unlikeToken copy];
        if (updateBlock != NULL) {
          updateBlock(FBSDKTriStateBOOLFromBOOL(self.objectIsLiked),
                      self->_likeCountStringWithLike,
                      self->_likeCountStringWithoutLike,
                      self->_socialSentenceWithLike,
                      self->_socialSentenceWithoutLike,
                      self->_unlikeToken,
                      NO,
                      NO);
        }
        [self _publishIfNeededWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
      } else {
        [self _presentLikeDialogWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
      }
    };
    FBSDKLikeActionControllerAddPublishLikeRequest(self->_accessToken,
                                                   connection,
                                                   verifiedObjectID,
                                                   self->_objectType,
                                                   completionHandler);
    [connection start];
  }];
}

- (void)_publishUnlikeWithUpdateBlock:(fbsdk_like_action_block)updateBlock
                  analyticsParameters:(NSDictionary *)analyticsParameters
                   fromViewController:(UIViewController *)fromViewController
{
  _objectIsLikedIsPending = YES;
  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
  [connection overrideGraphAPIVersion:FBSDK_LIKE_ACTION_CONTROLLER_API_VERSION];
  fbsdk_like_action_controller_publish_unlike_completion_block completionHandler = ^(BOOL success) {
    self->_objectIsLikedIsPending = NO;
    if (success) {
      [FBSDKAppEvents logImplicitEvent:FBSDKAppEventNameFBSDKLikeControlDidUnlike
                            valueToSum:nil
                            parameters:analyticsParameters
                           accessToken:self->_accessToken];
      self->_objectIsLikedOnServer = NO;
      self->_unlikeToken = nil;
      if (updateBlock != NULL) {
        updateBlock(FBSDKTriStateBOOLFromBOOL(self.objectIsLiked),
                    self->_likeCountStringWithLike,
                    self->_likeCountStringWithoutLike,
                    self->_socialSentenceWithLike,
                    self->_socialSentenceWithoutLike,
                    self->_unlikeToken,
                    NO,
                    NO);
      }
      [self _publishIfNeededWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    } else {
      [self _presentLikeDialogWithUpdateBlock:updateBlock analyticsParameters:analyticsParameters fromViewController:fromViewController];
    }
  };
  FBSDKLikeActionControllerAddPublishUnlikeRequest(_accessToken,
                                                   connection,
                                                   _unlikeToken,
                                                   _objectType,
                                                   completionHandler);
  [connection start];
}

- (void)_refreshWithMode:(FBSDKLikeActionControllerRefreshMode)mode
{
  switch (mode) {
    case FBSDKLikeActionControllerRefreshModeForce:{
      // if we're already refreshing, skip
      if (_refreshState == FBSDKLikeActionControllerRefreshStateActive) {
        return;
      }
      break;
    }
    case FBSDKLikeActionControllerRefreshModeInitial:{
      // if we've already started any refresh, skip this
      if (_refreshState != FBSDKLikeActionControllerRefreshStateNone) {
        return;
      }
      break;
    }
  }

  // You must be logged in to fetch the like status
  if (!_accessToken) {
    return;
  }

  [self _setExecuting:YES forKey:FBSDK_LIKE_ACTION_CONTROLLER_REFRESH_PROPERTY_KEY];
  _refreshState = FBSDKLikeActionControllerRefreshStateActive;

  [self _ensureVerifiedObjectID:^(NSString *verifiedObjectID) {
    FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
    [connection overrideGraphAPIVersion:FBSDK_LIKE_ACTION_CONTROLLER_API_VERSION];
    FBSDKLikeActionControllerAddRefreshRequests(self->_accessToken,
                                                connection,
                                                verifiedObjectID,
                                                self->_objectType,
                                                ^(FBSDKTriStateBOOL objectIsLiked,
                                                  NSString *likeCountStringWithLike,
                                                  NSString *likeCountStringWithoutLike,
                                                  NSString *socialSentenceWithLike,
                                                  NSString *socialSentenceWithoutLike,
                                                  NSString *unlikeToken,
                                                  BOOL likeStateChanged,
                                                  BOOL animated) {
                                                  [self _updateWithObjectIsLiked:objectIsLiked
                                                         likeCountStringWithLike:likeCountStringWithLike
                                                      likeCountStringWithoutLike:likeCountStringWithoutLike
                                                          socialSentenceWithLike:socialSentenceWithLike
                                                       socialSentenceWithoutLike:socialSentenceWithoutLike
                                                                     unlikeToken:unlikeToken
                                                                    soundEnabled:NO
                                                                        animated:NO
                                                                        deferred:NO];
                                                  [self _setExecuting:NO forKey:FBSDK_LIKE_ACTION_CONTROLLER_REFRESH_PROPERTY_KEY];
                                                  self->_refreshState = FBSDKLikeActionControllerRefreshStateComplete;
                                                });
    [connection start];
  }];
}

- (void)_setExecuting:(BOOL)executing forKey:(NSString *)key
{
  static NSMapTable *_executing = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _executing = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsCopyIn valueOptions:NSPointerFunctionsStrongMemory capacity:0];
  });

  NSString *objectKey = [NSString stringWithFormat:
                         @"%@:%@:%@",
                         _objectID,
                         NSStringFromFBSDKLikeObjectType(_objectType),
                         key];
  if (executing) {
    [self beginContentAccess];
    [_executing setObject:self forKey:objectKey];
  } else {
    [_executing removeObjectForKey:objectKey];
    [self endContentAccess];
  }
}

- (void)_updateWithObjectIsLiked:(FBSDKTriStateBOOL)objectIsLikedTriState
         likeCountStringWithLike:(NSString *)likeCountStringWithLike
      likeCountStringWithoutLike:(NSString *)likeCountStringWithoutLike
          socialSentenceWithLike:(NSString *)socialSentenceWithLike
       socialSentenceWithoutLike:(NSString *)socialSentenceWithoutLike
                     unlikeToken:(NSString *)unlikeToken
                    soundEnabled:(BOOL)soundEnabled
                        animated:(BOOL)animated
                        deferred:(BOOL)deferred
{
  if (objectIsLikedTriState != FBSDKTriStateBOOLValueUnknown) {
    _lastUpdateTime = [NSDate date];
  }

  // This value will not be useable if objectIsLikedTriState is FBSDKTriStateBOOLValueUnknown
  BOOL objectIsLiked = BOOLFromFBSDKTriStateBOOL(objectIsLikedTriState, NO);

  // So always check objectIsLikedChanged before using objectIsLiked.
  // If the new like state is unknown, we don't consider the state to have changed.
  BOOL objectIsLikedChanged = (objectIsLikedTriState != FBSDKTriStateBOOLValueUnknown) && (self.objectIsLiked != objectIsLiked);

  if (!objectIsLikedChanged &&
      [FBSDKInternalUtility object:_likeCountStringWithLike isEqualToObject:likeCountStringWithLike] &&
      [FBSDKInternalUtility object:_likeCountStringWithoutLike isEqualToObject:likeCountStringWithoutLike] &&
      [FBSDKInternalUtility object:_socialSentenceWithLike isEqualToObject:socialSentenceWithLike] &&
      [FBSDKInternalUtility object:_socialSentenceWithoutLike isEqualToObject:socialSentenceWithoutLike] &&
      [FBSDKInternalUtility object:_unlikeToken isEqualToObject:unlikeToken]) {
    // check if the like state changed and only animate if it did
    return;
  }

  void(^updateBlock)(void) = ^{
    if (objectIsLikedChanged) {
      self->_objectIsLiked = objectIsLiked;
    }

    if (likeCountStringWithLike) {
      self->_likeCountStringWithLike = [likeCountStringWithLike copy];
    }
    if (likeCountStringWithoutLike) {
      self->_likeCountStringWithoutLike = [likeCountStringWithoutLike copy];
    }
    if (socialSentenceWithLike) {
      self->_socialSentenceWithLike = [socialSentenceWithLike copy];
    }
    if (socialSentenceWithoutLike) {
      self->_socialSentenceWithoutLike = [socialSentenceWithoutLike copy];
    }
    if (unlikeToken) {
      self->_unlikeToken = [unlikeToken copy];
    }

    // if only meta data changed, don't play the sound
    FBSDKLikeButtonPopWAV *likeSound = (objectIsLikedChanged && objectIsLiked && soundEnabled ? [FBSDKLikeButtonPopWAV sharedLoader] : nil);

    void(^notificationBlock)(void) = ^{
      if (likeSound) {
        dispatch_time_t soundPopTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(FBSDK_LIKE_ACTION_CONTROLLER_SOUND_DELAY * NSEC_PER_SEC));
        dispatch_after(soundPopTime, dispatch_get_main_queue(), ^(void){
          [likeSound playSound];
        });
      }
      NSDictionary *userInfo = @{FBSDKLikeActionControllerAnimatedKey: @(animated)};
      [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKLikeActionControllerDidUpdateNotification
                                                          object:self
                                                        userInfo:userInfo];
    };

    notificationBlock();
  };

  // if only meta data changed, don't defer
  if (deferred && objectIsLikedChanged) {
    double delayInSeconds = FBSDK_LIKE_ACTION_CONTROLLER_ANIMATION_DELAY;
    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
    dispatch_after(popTime, dispatch_get_main_queue(), updateBlock);
  } else {
    updateBlock();
  }
}

- (BOOL)_useOGLike
{
  return (_accessToken &&
          !_objectIsPage &&
          _verifiedObjectID &&
          [_accessToken.permissions containsObject:@"publish_actions"]);
}

@end
