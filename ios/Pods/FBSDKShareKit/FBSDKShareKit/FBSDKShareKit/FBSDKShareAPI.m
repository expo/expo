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

#import "FBSDKShareAPI.h"

#if !TARGET_OS_TV
#import <AssetsLibrary/AssetsLibrary.h>
#endif

#import <FBSDKCoreKit/FBSDKGraphRequest.h>
#import <FBSDKCoreKit/FBSDKGraphRequestDataAttachment.h>

#import "FBSDKCoreKit+Internal.h"
#import "FBSDKShareConstants.h"
#import "FBSDKShareDefines.h"
#import "FBSDKShareError.h"
#import "FBSDKShareLinkContent.h"
#import "FBSDKShareOpenGraphAction.h"
#import "FBSDKShareOpenGraphContent.h"
#import "FBSDKShareOpenGraphObject.h"
#import "FBSDKSharePhoto.h"
#import "FBSDKSharePhotoContent.h"
#import "FBSDKShareUtility.h"
#import "FBSDKShareVideo.h"
#import "FBSDKShareVideoContent.h"
#import "FBSDKVideoUploader.h"

static NSString *const FBSDKShareAPIDefaultGraphNode = @"me";
static NSString *const FBSDKShareAPIPhotosEdge = @"photos";
static NSString *const FBSDKShareAPIVideosEdge = @"videos";
static NSMutableArray *g_pendingFBSDKShareAPI;

@interface FBSDKShareAPI () <FBSDKVideoUploaderDelegate>
@end

@implementation FBSDKShareAPI {
  NSFileHandle *_fileHandle;
#if !TARGET_OS_TV
  ALAssetRepresentation *_assetRepresentation;
#endif
}

#pragma mark - Class Methods

+ (instancetype)shareWithContent:(id<FBSDKSharingContent>)content delegate:(id<FBSDKSharingDelegate>)delegate
{
  FBSDKShareAPI *API = [[self alloc] init];
  API.shareContent = content;
  API.delegate = delegate;
  [API share];
  return API;
}

#pragma mark - Properties

@synthesize delegate = _delegate;
@synthesize shareContent = _shareContent;
@synthesize shouldFailOnDataError = _shouldFailOnDataError;
@synthesize accessToken = _accessToken;

#pragma mark - Object Lifecycle

#if !TARGET_OS_TV
+ (ALAssetsLibrary *)defaultAssetsLibrary {
  static dispatch_once_t pred = 0;
  static ALAssetsLibrary *library = nil;
  dispatch_once(&pred, ^{
    library = [[fbsdkdfl_ALAssetsLibraryClass() alloc] init];
  });
  return library;
}
#endif

+ (void)initialize
{
  if (self == [FBSDKShareAPI class]) {
    g_pendingFBSDKShareAPI = [[NSMutableArray alloc] init];
  }
}

- (instancetype)init
{
  if ((self = [super init])) {
    _graphNode = FBSDKShareAPIDefaultGraphNode;
  }
  return self;
}

#pragma mark - Public Methods

- (BOOL)canShare
{
  return YES;
}

- (BOOL)createOpenGraphObject:(FBSDKShareOpenGraphObject *)openGraphObject
{
  NSError *error;
  if (![self canShare]) {
    NSString *message = @"Share API is not available; verify 'canShare' returns YES";
    error = [FBSDKShareError errorWithCode:FBSDKShareDialogNotAvailableErrorCode message:message];
    [_delegate sharer:self didFailWithError:error];
    return NO;
  }
  if (![self _hasPublishActions]) {
    NSString *message = @"Warning: Access token is missing publish_actions permissions";
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors logEntry:message];
  }
  if (!openGraphObject) {
    error = [FBSDKShareError requiredArgumentErrorWithName:@"openGraphObject" message:nil];
    [_delegate sharer:self didFailWithError:error];
    return NO;
  }

  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
  void(^completionHandler)(id) = ^(NSDictionary *result) {
    [_delegate sharer:self didCompleteWithResults:result];
  };
  if (![self _stageOpenGraphObject:openGraphObject
                        connection:connection
                    stagingHandler:NULL
                 completionHandler:completionHandler]) {
    return NO;
  }
  [connection start];
  return YES;
}

- (BOOL)share
{
  NSError *error;
  if (![self canShare]) {
    NSString *message = @"Share API is not available; verify 'canShare' returns YES";
    error = [FBSDKShareError errorWithCode:FBSDKShareDialogNotAvailableErrorCode message:message];
    [_delegate sharer:self didFailWithError:error];
    return NO;
  }
  if (![self _hasPublishActions]) {
    NSString *message = @"Warning: Access token is missing publish_actions permissions";
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors logEntry:message];
  }
  if (![self validateWithError:&error]) {
    [_delegate sharer:self didFailWithError:error];
    return NO;
  }
  id<FBSDKSharingContent> shareContent = self.shareContent;

  if ([shareContent isKindOfClass:[FBSDKShareLinkContent class]]) {
    return [self _shareLinkContent:(FBSDKShareLinkContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKSharePhotoContent class]]) {
    return [self _sharePhotoContent:(FBSDKSharePhotoContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    return [self _shareVideoContent:(FBSDKShareVideoContent *)shareContent];
  } else if ([shareContent isKindOfClass:[FBSDKShareOpenGraphContent class]]) {
    return [self _shareOpenGraphContent:(FBSDKShareOpenGraphContent *)shareContent];
  } else {
    return NO;
  }
}

- (BOOL)validateWithError:(NSError *__autoreleasing *)errorRef
{
  id<FBSDKSharingContent> shareContent = self.shareContent;
  if (!shareContent) {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError requiredArgumentErrorWithName:@"shareContent" message:@"Share content cannot be null."];
    }
    return NO;
  }
  if ([shareContent isKindOfClass:[FBSDKShareVideoContent class]]) {
    if (shareContent.peopleIDs.count > 0) {
      if (errorRef != NULL) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"peopleIDs" value:shareContent.peopleIDs message:@"Cannot specify peopleIDs with FBSDKShareVideoContent."];
      }
      return NO;
    }
    if (shareContent.placeID) {
      if (errorRef != NULL) {
        *errorRef = [FBSDKShareError invalidArgumentErrorWithName:@"placeID" value:shareContent.placeID message:@"Cannot specify place ID with FBSDKShareVideoContent."];
      }
      return NO;
    }
  }
  if (errorRef != NULL){
    *errorRef = nil;
  }
  return [FBSDKShareUtility validateShareContent:shareContent bridgeOptions:FBSDKShareBridgeOptionsDefault error:errorRef];
}

- (FBSDKAccessToken *)accessToken
{
  return _accessToken ?: [FBSDKAccessToken currentAccessToken];
}

#pragma mark - Helper Methods

- (NSString *)_graphPathWithSuffix:(NSString *)suffix, ... NS_REQUIRES_NIL_TERMINATION
{
  NSMutableString *graphPath = [[NSMutableString alloc] initWithString:self.graphNode];
  va_list args;
  va_start(args, suffix);
  for (NSString *arg = suffix; arg != nil; arg = va_arg(args, NSString *)) {
    [graphPath appendFormat:@"/%@", arg];
  }
  va_end(args);
  return graphPath;
}

- (void)_addCommonParameters:(NSMutableDictionary *)parameters content:(id<FBSDKSharingContent>)content
{
  if (content.peopleIDs.count > 0) {
    NSString *tags;
    if ([content isKindOfClass:[FBSDKSharePhotoContent class]]) {
      NSMutableArray *tagsArray = [[NSMutableArray alloc] init];
      for (NSString *peopleID in content.peopleIDs) {
        [tagsArray addObject:@{ @"tag_uid" : peopleID }];
      }
      NSData *tagsJSON = [NSJSONSerialization dataWithJSONObject:tagsArray options:0 error:nil];
      tags = [[NSString alloc] initWithData:tagsJSON encoding:NSUTF8StringEncoding];
    } else {
      tags = [content.peopleIDs componentsJoinedByString:@","];
    }
    [FBSDKInternalUtility dictionary:parameters setObject:tags forKey:@"tags"];
  }
  [FBSDKInternalUtility dictionary:parameters setObject:content.placeID forKey:@"place"];
  [FBSDKInternalUtility dictionary:parameters setObject:content.ref forKey:@"ref"];
}

- (BOOL)_hasPublishActions
{
  return [self.accessToken.permissions containsObject:@"publish_actions"];
}

- (BOOL)_shareLinkContent:(FBSDKShareLinkContent *)linkContent
{
  FBSDKGraphRequestHandler completionHandler = ^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (!_delegate) {
      return;
    }
    if (error) {
      [_delegate sharer:self didFailWithError:error];
    } else {
      result = [FBSDKTypeUtility dictionaryValue:result];
      NSMutableDictionary *shareResults = [[NSMutableDictionary alloc] init];
      [FBSDKInternalUtility dictionary:shareResults setObject:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_POST
                                forKey:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY];
      [FBSDKInternalUtility dictionary:shareResults setObject:[FBSDKTypeUtility stringValue:result[@"id"]]
                                forKey:FBSDK_SHARE_RESULT_POST_ID_KEY];
      [_delegate sharer:self didCompleteWithResults:shareResults];
    }
  };
  NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
  [self _addCommonParameters:parameters content:linkContent];
  [FBSDKInternalUtility dictionary:parameters setObject:self.message forKey:@"message"];
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentURL forKey:@"link"];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.imageURL forKey:@"picture"];
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentTitle forKey:@"name"];
  [FBSDKInternalUtility dictionary:parameters setObject:linkContent.contentDescription forKey:@"description"];
#pragma clang diagnostic pop
  [[[FBSDKGraphRequest alloc] initWithGraphPath:[self _graphPathWithSuffix:@"feed", nil]
                                     parameters:parameters
                                    tokenString:self.accessToken.tokenString
                                        version:nil
                                     HTTPMethod:@"POST"] startWithCompletionHandler:completionHandler];
  return YES;
}

- (BOOL)_shareOpenGraphContent:(FBSDKShareOpenGraphContent *)openGraphContent
{
  // In order to create a new Open Graph action using a custom object that does not already exist (objectID or URL), you
  // must first send a request to post the object and then another to post the action.  If a local image is supplied
  // with the object or action, that must be staged first and then referenced by the staging URL that is returned by
  // that request.
  FBSDKShareOpenGraphAction *action = openGraphContent.action;
  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
  void(^stagingHandler)(NSDictionary *) = ^(NSDictionary *stagedContainer) {
    NSMutableDictionary *parameters = [NSMutableDictionary dictionaryWithDictionary:stagedContainer];
    [self _addCommonParameters:parameters content:openGraphContent];
    [FBSDKInternalUtility dictionary:parameters setObject:self.message forKey:@"message"];

    FBSDKGraphRequestHandler requestHandler = ^(FBSDKGraphRequestConnection *requestConnection,
                                                id result,
                                                NSError *requestError) {
      if (!_delegate) {
        return;
      }
      if (requestError) {
        NSError *error = [FBSDKShareError errorWithCode:FBSDKShareOpenGraphErrorCode
                                                message:@"Error sharing Open Graph content"
                                        underlyingError:requestError];
        [_delegate sharer:self didFailWithError:error];
      } else if (result) {
        NSMutableDictionary *shareResults = [[NSMutableDictionary alloc] init];
        [FBSDKInternalUtility dictionary:shareResults setObject:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_POST
                                  forKey:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY];
        [FBSDKInternalUtility dictionary:shareResults setObject:[FBSDKTypeUtility stringValue:result[@"id"]]
                                  forKey:FBSDK_SHARE_RESULT_POST_ID_KEY];
        [_delegate sharer:self didCompleteWithResults:shareResults];
      }
    };
    NSString *graphPath = [self _graphPathWithSuffix:[FBSDKUtility URLEncode:action.actionType], nil];
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:graphPath
                                                                   parameters:parameters
                                                                  tokenString:self.accessToken.tokenString
                                                                      version:nil
                                                                   HTTPMethod:@"POST"];
    [self _connection:connection addRequest:request completionHandler:requestHandler];
    [connection start];
  };
  if (![self _stageOpenGraphValueContainer:action connection:connection stagingHandler:stagingHandler]) {
    return NO;
  }
  return YES;
}

- (BOOL)_sharePhotoContent:(FBSDKSharePhotoContent *)photoContent
{
  NSArray *photos = photoContent.photos;
  NSMutableArray *requests = [[NSMutableArray alloc] init];
  for (FBSDKSharePhoto *photo in photos) {
    UIImage *image = photo.image;
    if (!image && [photo.imageURL isFileURL]) {
      image = [UIImage imageWithContentsOfFile:[photo.imageURL path]];
    }
    if (image) {
      NSString *graphPath = [self _graphPathWithSuffix:FBSDKShareAPIPhotosEdge, nil];
      NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
      [self _addCommonParameters:parameters content:photoContent];
      NSString *caption = photo.caption ?: self.message;
      [FBSDKInternalUtility dictionary:parameters setObject:caption forKey:@"caption"];
      parameters[@"picture"] = image;
      [requests addObject:[[FBSDKGraphRequest alloc] initWithGraphPath:graphPath
                                                            parameters:parameters
                                                           tokenString:self.accessToken.tokenString
                                                               version:nil
                                                            HTTPMethod:@"POST"]];
    }
  }
  NSUInteger requestCount = [requests count];
  NSMutableArray *results = [[NSMutableArray alloc] init];
  NSMutableArray *errors = [[NSMutableArray alloc] init];
  __block NSUInteger completedCount = 0;
  FBSDKGraphRequestHandler completionHandler = ^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    result = [FBSDKTypeUtility dictionaryValue:result];
    [FBSDKInternalUtility array:results addObject:result];
    [FBSDKInternalUtility array:errors addObject:error];
    if (++completedCount != requestCount) {
      return;
    }
    if (!_delegate) {
      return;
    }
    if ([errors count]) {
      [_delegate sharer:self didFailWithError:errors[0]];
    } else if ([results count]) {
      NSArray *individualPhotoIDs = [results valueForKeyPath:@"id"];
      // each photo upload will be merged into the same post, so grab the post_id from the first and use that
      NSMutableDictionary *shareResults = [[NSMutableDictionary alloc] init];
      [FBSDKInternalUtility dictionary:shareResults setObject:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_POST
                                forKey:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY];
      NSDictionary *firstResult = [FBSDKTypeUtility dictionaryValue:results[0]];
      [FBSDKInternalUtility dictionary:shareResults setObject:[FBSDKTypeUtility stringValue:firstResult[@"post_id"]]
                                forKey:FBSDK_SHARE_RESULT_POST_ID_KEY];
      [FBSDKInternalUtility dictionary:shareResults setObject:individualPhotoIDs forKey:FBSDK_SHARE_RESULT_PHOTO_IDS_KEY];
      [_delegate sharer:self didCompleteWithResults:shareResults];
    }
  };
  for (FBSDKGraphRequest *request in requests) {
    [request startWithCompletionHandler:completionHandler];
  }
  return YES;
}

- (BOOL)_shareVideoContent:(FBSDKShareVideoContent *)videoContent
{
  NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
  [self _addCommonParameters:parameters content:videoContent];
  [FBSDKInternalUtility dictionary:parameters setObject:self.message forKey:@"description"];
  if ([self.accessToken.permissions containsObject:@"ads_management"]) {
    FBSDKSharePhoto *photo = videoContent.previewPhoto;
    UIImage *image = photo.image;
    if (!image && [photo.imageURL isFileURL]) {
      image = [UIImage imageWithContentsOfFile:[photo.imageURL path]];
    }
    [FBSDKInternalUtility dictionary:parameters setObject:image forKey:@"thumb"];
  }
  FBSDKShareVideo *video = videoContent.video;
  NSURL *videoURL = video.videoURL;
  if ([videoURL isFileURL]) {
    NSError *fileError;
    _fileHandle = [NSFileHandle fileHandleForReadingFromURL:videoURL error:&fileError];
    if (!_fileHandle) {
      [_delegate sharer:self didFailWithError:fileError];
      return NO;
    }
    if (![self _addToPendingShareAPI]) {
      return NO;
    }
    FBSDKVideoUploader *videoUploader = [[FBSDKVideoUploader alloc] initWithVideoName:[videoURL lastPathComponent]
                                                                            videoSize:(unsigned long)[_fileHandle seekToEndOfFile]
                                                                           parameters:parameters
                                                                             delegate:self];
    videoUploader.graphNode = self.graphNode;
    [videoUploader start];
    return YES;
  } else if (videoURL) {
#if TARGET_OS_TV
    return NO;
#else
    if (![self _addToPendingShareAPI]) {
      return NO;
    }
    [[FBSDKShareAPI defaultAssetsLibrary] assetForURL:videoURL resultBlock:^(ALAsset *asset) {
      _assetRepresentation = [asset defaultRepresentation];
      NSUInteger size = (NSUInteger)_assetRepresentation.size;
      FBSDKVideoUploader *videoUploader = [[FBSDKVideoUploader alloc] initWithVideoName:[videoURL lastPathComponent]
                                                                              videoSize:size
                                                                             parameters:parameters
                                                                               delegate:self];
      videoUploader.graphNode = self.graphNode;
      [videoUploader start];
    } failureBlock:^(NSError *error) {
      [_delegate sharer:self didFailWithError:error];
    }];
    return YES;
#endif
  } else {
    return NO;
  }
}

- (BOOL)_addEncodedParametersToDictionary:(NSMutableDictionary *)parameters
                                      key:(NSString *)key
                                    value:(id)value
                                    error:(NSError **)errorRef
{
  if ([value isKindOfClass:[NSString class]] ||
      [value isKindOfClass:[NSNumber class]] ||
      [value isKindOfClass:[NSNull class]]) {
    parameters[key] = value;
  } else if ([value isKindOfClass:[NSArray class]]) {
    __block BOOL didEncode = YES;
    [(NSArray *)value enumerateObjectsUsingBlock:^(id subvalue, NSUInteger idx, BOOL *stop) {
      NSString *subkey = [[NSString alloc] initWithFormat:@"%@[%lu]", key, (unsigned long)idx];
      if (![self _addEncodedParametersToDictionary:parameters key:subkey value:subvalue error:errorRef]) {
        *stop = YES;
        didEncode = NO;
      }
    }];
    if (!didEncode) {
      return NO;
    }
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    __block BOOL didEncode = YES;
    [(NSDictionary *)value enumerateKeysAndObjectsUsingBlock:^(id subkey, id subvalue, BOOL *stop) {
      subkey = [[NSString alloc] initWithFormat:@"%@[%@]", key, subkey];
      if (![self _addEncodedParametersToDictionary:parameters key:subkey value:subvalue error:errorRef]) {
        *stop = YES;
        didEncode = NO;
      }
    }];
    if (!didEncode) {
      return NO;
    }
  } else {
    if (errorRef != NULL) {
      *errorRef = [FBSDKShareError invalidArgumentErrorWithName:key value:value message:nil];
    }
    return NO;
  }
  if (errorRef != NULL) {
    *errorRef = nil;
  }
  return YES;
}

- (BOOL)_stageArray:(NSArray *)array
         connection:(FBSDKGraphRequestConnection *)connection
     stagingHandler:(void(^)(NSArray *stagedArray))stagingHandler
{
  __block BOOL result = YES;
  __block NSUInteger pendingCount = 1;
  NSMutableArray *stagedArray = [[NSMutableArray alloc] initWithArray:array];
  void(^itemDidFail)(void) = ^{
    if (!result) {
      return;
    }
    result = NO;
  };
  void(^itemDidSucceed)(void) = ^{
    if (!result) {
      return;
    }
    if ((--pendingCount == 0) && (stagingHandler != NULL)) {
      stagingHandler(stagedArray);
    }
  };
  [array enumerateObjectsUsingBlock:^(id item, NSUInteger idx, BOOL *stop) {
    pendingCount++;
    void(^itemHandler)(id) = ^(id stagedValue) {
      if (stagedValue) {
        stagedArray[idx] = stagedValue;
        itemDidSucceed();
      } else {
        NSError *error = [FBSDKShareError invalidArgumentErrorWithName:@"value"
                                                                 value:item
                                                               message:@"Error staging object."];
        [_delegate sharer:self didFailWithError:error];
        itemDidFail();
        *stop = YES;
        result = NO;
      }
    };
    if (![self _stageValue:item connection:connection stagingHandler:itemHandler]) {
      itemDidFail();
      *stop = YES;
      result = NO;
    }
  }];
  if (result) {
    itemDidSucceed();
  }
  return result;
}

- (BOOL)_stageOpenGraphObject:(FBSDKShareOpenGraphObject *)openGraphObject
                   connection:(FBSDKGraphRequestConnection *)connection
               stagingHandler:(void(^)(id stagedObject))stagingHandler
            completionHandler:(void(^)(NSDictionary *result))completionHandler
{
  NSString *type = [FBSDKTypeUtility stringValue:openGraphObject[@"og:type"]];
  if (!type) {
    NSString *message = @"Open Graph objects must contain a og:type value.";
    NSError *error = [FBSDKShareError requiredArgumentErrorWithName:@"og:type" message:message];
    [_delegate sharer:self didFailWithError:error];
    return NO;
  }
  void(^containerHandler)(NSDictionary *) = ^(NSDictionary *stagedContainer) {
    NSError *JSONError;
    NSString *objectString = [FBSDKInternalUtility JSONStringForObject:stagedContainer
                                                                 error:&JSONError
                                                  invalidObjectHandler:NULL];
    if (!objectString) {
      [_delegate sharer:self didFailWithError:JSONError];
      return;
    }
    NSString *graphPath = [self _graphPathWithSuffix:@"objects", type, nil];
    NSDictionary *parameters = @{ @"object": objectString };
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:graphPath
                                                                   parameters:parameters
                                                                  tokenString:self.accessToken.tokenString
                                                                      version:nil
                                                                   HTTPMethod:@"POST"];
    FBSDKGraphRequestHandler requestCompletionHandler = ^(FBSDKGraphRequestConnection *requestConnection,
                                                          id result,
                                                          NSError *requestError) {
      if (!_delegate) {
        return;
      }
      if (requestError) {
        NSString *message = [[NSString alloc] initWithFormat:@"Error creating Open Graph object: %@",
                             requestError.description];
        NSError *error = [FBSDKShareError errorWithCode:FBSDKShareOpenGraphErrorCode
                                                message:message
                                        underlyingError:requestError];
        [_delegate sharer:self didFailWithError:error];
      } else if (completionHandler != NULL) {
        completionHandler([FBSDKTypeUtility dictionaryValue:result]);
      }
    };
    NSString *batchEntryName = [self _connection:connection
                                      addRequest:request
                               completionHandler:requestCompletionHandler];
    if (stagingHandler != NULL) {
      stagingHandler([[NSString alloc] initWithFormat:@"{result=%@:$.id}", batchEntryName]);
    }
  };
  return [self _stageOpenGraphValueContainer:openGraphObject connection:connection stagingHandler:containerHandler];
  return YES;
}

- (BOOL)_stageOpenGraphValueContainer:(id<FBSDKShareOpenGraphValueContaining>)container
                           connection:(FBSDKGraphRequestConnection *)connection
                       stagingHandler:(void(^)(NSDictionary *stagedContainer))stagingHandler
{
  __block BOOL result = YES;
  __block NSUInteger pendingCount = 1;
  NSMutableDictionary *stagedContainer = [[NSMutableDictionary alloc] init];
  void(^itemDidFail)(void) = ^{
    if (!result) {
      return;
    }
    result = NO;
  };
  void(^itemDidSucceed)(void) = ^{
    if (!result) {
      return;
    }
    if ((--pendingCount == 0) && (stagingHandler != NULL)) {
      stagingHandler(stagedContainer);
    }
  };
  BOOL isAction = [container isKindOfClass:[FBSDKShareOpenGraphAction class]];
  [container enumerateKeysAndObjectsUsingBlock:^(NSString *key, id object, BOOL *stop) {
    pendingCount++;

    // The server does not understand custom namespaces remove them until the server is fixed
    NSString *namespace;
    key = [FBSDKShareUtility getOpenGraphNameAndNamespaceFromFullName:key namespace:&namespace];
    if (namespace && !isAction) {
      if (!stagedContainer[namespace]) {
        stagedContainer[namespace] = [[NSMutableDictionary alloc] init];
      }
    }

    void(^itemHandler)(id) = ^(id stagedValue) {
      if (stagedValue) {
        if (isAction) {
          NSError *error;
          if (![self _addEncodedParametersToDictionary:stagedContainer key:key value:stagedValue error:&error]) {
            [_delegate sharer:self didFailWithError:error];
            itemDidFail();
            return;
          }
        } else {
          NSMutableDictionary *valueContainer = (namespace ? stagedContainer[namespace] : stagedContainer);
          valueContainer[key] = stagedValue;
        }
      }
      itemDidSucceed();
    };
    if (![self _stageValue:object connection:connection stagingHandler:itemHandler]) {
      *stop = YES;
      result = NO;
    }
  }];
  if (result) {
    itemDidSucceed();
  }
  return result;
}

- (BOOL)_stagePhoto:(FBSDKSharePhoto *)photo
         connection:(FBSDKGraphRequestConnection *)connection
     stagingHandler:(void(^)(id stagedPhoto))stagingHandler
{
  if (photo.imageURL) {
    NSMutableDictionary *stagedPhoto = [[NSMutableDictionary alloc]initWithDictionary: @{
                                                                                         @"url": photo.imageURL.absoluteString,
                                                                                         @"user_generated": @(photo.userGenerated),
                                                                                         }];
    [FBSDKInternalUtility dictionary:stagedPhoto setObject:photo.caption forKey:@"caption"];
    if (stagingHandler) {
      stagingHandler(stagedPhoto);
    }
    return YES;
  } else if (photo.image) {
    NSString *graphPath = @"/me/staging_resources";
    NSDictionary *parameters = @{ @"file": photo.image };
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:graphPath
                                                                   parameters:parameters
                                                                  tokenString:self.accessToken.tokenString
                                                                      version:nil
                                                                   HTTPMethod:@"POST"];
    FBSDKGraphRequestHandler completionHandler = ^(FBSDKGraphRequestConnection *requestConnection,
                                                   id result,
                                                   NSError *requestError) {
      NSString *stagedPhotoURLString = [FBSDKTypeUtility stringValue:result[@"uri"]];
      if (requestError || !stagedPhotoURLString) {
        NSError *error = [FBSDKShareError errorWithCode:FBSDKShareOpenGraphErrorCode
                                                message:@"Error staging photo"
                                        underlyingError:requestError];
        [_delegate sharer:self didFailWithError:error];
      } else if (stagingHandler) {
        NSMutableDictionary *stagedPhoto = [[NSMutableDictionary alloc] initWithDictionary: @{
                                                                                              @"url": stagedPhotoURLString,
                                                                                              @"user_generated": @(photo.userGenerated),
                                                                                              }];
        [FBSDKInternalUtility dictionary:stagedPhoto setObject:photo.caption forKey:@"caption"];
        stagingHandler(stagedPhoto);
      }
    };
    [request startWithCompletionHandler:completionHandler];
    return YES;
  } else {
    NSError *error = [FBSDKShareError invalidArgumentErrorWithName:@"photo"
                                                             value:photo
                                                           message:@"Photos must have an imageURL or image."];
    [_delegate sharer:self didFailWithError:error];
    return NO;
  }
}

- (BOOL)_stageValue:(id)value
         connection:(FBSDKGraphRequestConnection *)connection
     stagingHandler:(void(^)(id stagedValue))stagingHandler
{
  if ([value isKindOfClass:[NSString class]] ||
      [value isKindOfClass:[NSNumber class]]) {
    if (stagingHandler != NULL) {
      stagingHandler(value);
    }
    return YES;
  } else if ([value isKindOfClass:[NSURL class]]) {
    if (stagingHandler != NULL) {
      stagingHandler([(NSURL *)value absoluteString]);
    }
    return YES;
  } else if ([value isKindOfClass:[FBSDKSharePhoto class]]) {
    return [self _stagePhoto:(FBSDKSharePhoto *)value connection:connection stagingHandler:stagingHandler];
  } else if ([value isKindOfClass:[FBSDKShareOpenGraphObject class]]) {
    return [self _stageOpenGraphObject:(FBSDKShareOpenGraphObject *)value
                            connection:connection
                        stagingHandler:stagingHandler
                     completionHandler:NULL];
  } else if ([value isKindOfClass:[NSArray class]]) {
    return [self _stageArray:(NSArray *)value connection:connection stagingHandler:stagingHandler];
  } else {
    NSError *error = [FBSDKShareError invalidArgumentErrorWithName:@"value"
                                                             value:value
                                                           message:@"Invalid value type found in Open Graph object."];
    [_delegate sharer:self didFailWithError:error];
    return NO;
  }
}

- (NSString *)_connection:(FBSDKGraphRequestConnection *)connection
               addRequest:(FBSDKGraphRequest *)request
        completionHandler:(FBSDKGraphRequestHandler)completionHandler
{
  NSUInteger requestCount = [connection.requests count];
  NSString *batchEntryName = [[NSString alloc] initWithFormat:@"request_%lu", (unsigned long)requestCount];
  [connection addRequest:request completionHandler:completionHandler batchEntryName:batchEntryName];
  return batchEntryName;
}

- (BOOL)_addToPendingShareAPI
{
  @synchronized(g_pendingFBSDKShareAPI) {
    if ([g_pendingFBSDKShareAPI containsObject:self]) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors logEntry:@"FBSDKShareAPI did not share video content. Video upload already in progress."];
      return NO;
    }
    [g_pendingFBSDKShareAPI addObject:self];
    return YES;
  }
}

- (void)_removeFromPendingShareAPI
{
  @synchronized(g_pendingFBSDKShareAPI) {
    [g_pendingFBSDKShareAPI removeObject:self];
    _fileHandle = nil;
#if !TARGET_OS_TV
    _assetRepresentation = nil;
#endif
  }
}

#pragma mark - FBSDKVideoUploaderDelegate

- (NSData *)videoChunkDataForVideoUploader:(FBSDKVideoUploader *)videoUploader startOffset:(NSUInteger)startOffset endOffset:(NSUInteger)endOffset
{
  NSUInteger chunkSize = endOffset - startOffset;
  if (_fileHandle) {
    [_fileHandle seekToFileOffset:startOffset];
    NSData *videoChunkData = [_fileHandle readDataOfLength:chunkSize];
    if (videoChunkData == nil || videoChunkData.length != chunkSize) {
      return nil;
    }
    return videoChunkData;
  }
#if !TARGET_OS_TV
  else if (_assetRepresentation) {
    NSMutableData *data = [NSMutableData dataWithLength:chunkSize];
    NSError *error;
    NSUInteger bufferedLength = [_assetRepresentation getBytes:[data mutableBytes] fromOffset:startOffset length:chunkSize error:&error];
    if (bufferedLength != chunkSize || data == nil || error) {
      return nil;
    }
    return data;
  }
#endif
  return nil;
}

- (void)videoUploader:(FBSDKVideoUploader *)videoUploader didCompleteWithResults:(NSDictionary *)results
{
  results = [FBSDKTypeUtility dictionaryValue:results];
  NSMutableDictionary *shareResults = [[NSMutableDictionary alloc] init];
  [FBSDKInternalUtility dictionary:shareResults setObject:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_POST forKey:FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY];
  [FBSDKInternalUtility dictionary:shareResults setObject:[FBSDKTypeUtility stringValue:results[FBSDK_SHARE_VIDEO_ID]] forKey:FBSDK_SHARE_VIDEO_ID];
  [_delegate sharer:self didCompleteWithResults:shareResults];
  [self _removeFromPendingShareAPI];
}

- (void)videoUploader:(FBSDKVideoUploader *)videoUploader didFailWithError:(NSError *)error
{
  [_delegate sharer:self didFailWithError:error];
  [self _removeFromPendingShareAPI];
}



@end
