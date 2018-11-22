// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXFirebaseStorage/EXFirebaseStorage.h>
#import <EXFirebaseApp/EXFirebaseAppUtil.h>
#import <MobileCoreServices/MobileCoreServices.h>
#import <Photos/Photos.h>
#import <Firebase.h>
#import <EXCore/EXUtilities.h>

static NSString *const STORAGE_EVENT = @"Expo.Firebase.storage_event";
static NSString *const STORAGE_ERROR = @"Expo.Firebase.storage_error";

static NSString *const STORAGE_STATE_CHANGED = @"Expo.Firebase.state_changed";
static NSString *const STORAGE_UPLOAD_SUCCESS = @"Expo.Firebase.upload_success";
static NSString *const STORAGE_UPLOAD_FAILURE = @"Expo.Firebase.upload_failure";
static NSString *const STORAGE_DOWNLOAD_SUCCESS = @"Expo.Firebase.download_success";
static NSString *const STORAGE_DOWNLOAD_FAILURE = @"Expo.Firebase.download_failure";

@interface EXFirebaseStorage ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;

@end

@implementation EXFirebaseStorage

EX_EXPORT_MODULE(ExpoFirebaseStorage);


- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _eventEmitter = [_moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
}

// Run on a different thread
- (dispatch_queue_t)methodQueue {
  return dispatch_queue_create("expo.modules.firebase.storage", DISPATCH_QUEUE_SERIAL);
}

/**
 delete
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#delete
 @param NSString path
 */
EX_EXPORT_METHOD_AS(delete,
                    delete:(NSString *)appDisplayName
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRStorageReference *fileRef = [self getReference:path appDisplayName:appDisplayName];
  
  [fileRef deleteWithCompletion:^(NSError *_Nullable error) {
    if (error != nil) {
      [self promiseRejectStorageException:reject error:error];
    } else {
      resolve([NSNull null]);
    }
  }];
}

/**
 getDownloadURL
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getDownloadURL
 @param NSString path
 */
EX_EXPORT_METHOD_AS(getDownloadURL,
                    getDownloadURL:(NSString *)appDisplayName
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRStorageReference *fileRef = [self getReference:path appDisplayName:appDisplayName];
  
  [fileRef downloadURLWithCompletion:^(NSURL *_Nullable URL, NSError *_Nullable error) {
    if (error != nil) {
      [self promiseRejectStorageException:reject error:error];
    } else {
      resolve([URL absoluteString]);
    }
  }];
}

/**
 getMetadata
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getMetadata
 @param NSString path
 */
EX_EXPORT_METHOD_AS(getMetadata,
                    getMetadata:(NSString *)appDisplayName
                    path:(NSString *)path
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRStorageReference *fileRef = [self getReference:path appDisplayName:appDisplayName];
  
  [fileRef metadataWithCompletion:^(FIRStorageMetadata *_Nullable metadata, NSError *_Nullable error) {
    if (error != nil) {
      [self promiseRejectStorageException:reject error:error];
    } else {
      resolve([metadata dictionaryRepresentation]);
    }
  }];
}

/**
 updateMetadata
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#updateMetadata
 @param NSString path
 @param NSDictionary metadata
 */
EX_EXPORT_METHOD_AS(updateMetadata,
                    updateMetadata:(NSString *)appDisplayName
                    path:(NSString *)path
                    metadata:(NSDictionary *)metadata
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRStorageReference *fileRef = [self getReference:path appDisplayName:appDisplayName];
  FIRStorageMetadata *firmetadata = [self buildMetadataFromMap:metadata];
  
  [fileRef updateMetadata:firmetadata completion:^(FIRStorageMetadata *_Nullable metadata, NSError *_Nullable error) {
    if (error != nil) {
      [self promiseRejectStorageException:reject error:error];
    } else {
      resolve([metadata dictionaryRepresentation]);
    }
  }];
}

/**
 downloadFile
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#downloadFile
 @param NSString path
 @param NSString localPath
 */
EX_EXPORT_METHOD_AS(downloadFile,
                    downloadFile:(NSString *)appDisplayName
                    path:(NSString *)path
                    localPath:(NSString *)localPath
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRStorageReference *fileRef = [self getReference:path appDisplayName:appDisplayName];
  NSURL *localFile = [NSURL fileURLWithPath:localPath];
  
  __block FIRStorageDownloadTask *downloadTask;
  [EXUtilities performSynchronouslyOnMainThread:^{
    downloadTask = [fileRef writeToFile:localFile];
  }];
  
  // listen for state changes, errors, and completion of the download.
  [downloadTask observeStatus:FIRStorageTaskStatusResume handler:^(FIRStorageTaskSnapshot *snapshot) {
    // download resumed, also fires when the upload starts
    NSDictionary *event = [self getDownloadTaskAsDictionary:snapshot];
    [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_STATE_CHANGED props:event];
  }];
  
  [downloadTask observeStatus:FIRStorageTaskStatusPause handler:^(FIRStorageTaskSnapshot *snapshot) {
    // download paused
    NSDictionary *event = [self getDownloadTaskAsDictionary:snapshot];
    [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_STATE_CHANGED props:event];
  }];
  
  [downloadTask observeStatus:FIRStorageTaskStatusProgress handler:^(FIRStorageTaskSnapshot *snapshot) {
    // download reported progress
    NSDictionary *event = [self getDownloadTaskAsDictionary:snapshot];
    [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_STATE_CHANGED props:event];
  }];
  
  [downloadTask observeStatus:FIRStorageTaskStatusSuccess handler:^(FIRStorageTaskSnapshot *snapshot) {
    // download completed successfully
    NSDictionary *resp = [self getDownloadTaskAsDictionary:snapshot];
    [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_DOWNLOAD_SUCCESS props:resp];
    resolve(resp);
  }];
  
  [downloadTask observeStatus:FIRStorageTaskStatusFailure handler:^(FIRStorageTaskSnapshot *snapshot) {
    // download task failed
    // TODO sendJSError event
    if (snapshot.error != nil) {
      [self promiseRejectStorageException:reject error:snapshot.error];
    }
  }];
}

/**
 setMaxDownloadRetryTime
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxDownloadRetryTime
 @param NSNumber milliseconds
 */
EX_EXPORT_METHOD_AS(setMaxDownloadRetryTime,
                    setMaxDownloadRetryTime:(NSString *)appDisplayName
                    milliseconds:(nonnull NSNumber *)milliseconds
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  [[FIRStorage storageForApp:firApp] setMaxDownloadRetryTime:[milliseconds doubleValue]];
}

/**
 setMaxOperationRetryTime
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxOperationRetryTime
 @param NSNumber milliseconds
 */
EX_EXPORT_METHOD_AS(setMaxOperationRetryTime,
                    setMaxOperationRetryTime:(NSString *)appDisplayName
                    milliseconds:(nonnull NSNumber *)milliseconds
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  [[FIRStorage storageForApp:firApp] setMaxOperationRetryTime:[milliseconds doubleValue]];
}

/**
 setMaxUploadRetryTime
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Storage#setMaxUploadRetryTime
 */
EX_EXPORT_METHOD_AS(setMaxUploadRetryTime,
                    setMaxUploadRetryTime:(NSString *)appDisplayName
                    milliseconds:(nonnull NSNumber *)milliseconds
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  [[FIRStorage storageForApp:firApp] setMaxUploadRetryTime:[milliseconds doubleValue]];
}

/**
 putFile
 
 @url https://firebase.google.com/docs/reference/js/firebase.storage.Reference#putFile
 @param NSString path
 @param NSString localPath
 @param NSDictionary metadata
 */
EX_EXPORT_METHOD_AS(putFile,
                    putFile:(NSString *)appDisplayName
                    path:(NSString *)path
                    localPath:(NSString *)localPath
                    metadata:(NSDictionary *)metadata
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject) {
  FIRStorageMetadata *firmetadata = [self buildMetadataFromMap:metadata];
  
  if ([localPath hasPrefix:@"assets-library://"] || [localPath hasPrefix:@"ph://"]) {
    PHFetchResult *assets;
    
    if ([localPath hasPrefix:@"assets-library://"]) {
      NSURL *localFile = [[NSURL alloc] initWithString:localPath];
      assets = [PHAsset fetchAssetsWithALAssetURLs:@[localFile] options:nil];
    } else {
      NSString *assetId = [localPath substringFromIndex:@"ph://".length];
      assets = [PHAsset fetchAssetsWithLocalIdentifiers:@[assetId] options:nil];
    }
    
    PHAsset *asset = [assets firstObject];
    
    // this is based on http://stackoverflow.com/questions/35241449
    if (asset.mediaType == PHAssetMediaTypeImage) {
      // images
      PHImageRequestOptions *options = [PHImageRequestOptions new];
      options.networkAccessAllowed = true;
      [[PHImageManager defaultManager] requestImageDataForAsset:asset options:options resultHandler:^(NSData *imageData, NSString *dataUTI, UIImageOrientation orientation, NSDictionary *info) {
        if (info[PHImageErrorKey] == nil) {
          if (UTTypeConformsTo((__bridge CFStringRef)dataUTI, kUTTypeJPEG)) {
            firmetadata.contentType = [self utiToMimeType:dataUTI];
            [self uploadData:appDisplayName data:imageData firmetadata:firmetadata path:path resolver:resolve rejecter:reject];
          } else {
            // if the image UTI is not JPEG then convert to JPEG, e.g. HEI
            CGImageSourceRef source = CGImageSourceCreateWithData((__bridge CFDataRef)imageData, NULL);
            NSDictionary *imageInfo = (__bridge NSDictionary*)CGImageSourceCopyPropertiesAtIndex(source, 0, NULL);
            NSDictionary *imageMetadata = [imageInfo copy];
            NSMutableData *imageDataJPEG = [NSMutableData data];
            CGImageDestinationRef destination = CGImageDestinationCreateWithData((__bridge CFMutableDataRef)imageDataJPEG, kUTTypeJPEG, 1, NULL);
            CGImageDestinationAddImageFromSource(destination, source, 0, (__bridge CFDictionaryRef)imageMetadata);
            CGImageDestinationFinalize(destination);
            // Manually set mimetype to JPEG
            firmetadata.contentType = @"image/jpeg";
            [self uploadData:appDisplayName data:[NSData dataWithData:imageDataJPEG] firmetadata:firmetadata path:path resolver:resolve rejecter:reject];
          }
        } else {
          reject(@"storage/request-image-data-failed", @"Could not obtain image data for the specified file.", nil);
        }
      }];
    } else if (asset.mediaType == PHAssetMediaTypeVideo) {
      // video
      PHVideoRequestOptions *options = [PHVideoRequestOptions new];
      options.networkAccessAllowed = true;
      [[PHImageManager defaultManager] requestExportSessionForVideo:asset options:options exportPreset:AVAssetExportPresetHighestQuality resultHandler:^(AVAssetExportSession *_Nullable exportSession, NSDictionary *_Nullable info) {
        if (info[PHImageErrorKey] == nil) {
          NSURL *tempUrl = [self temporaryFileUrl];
          exportSession.outputURL = tempUrl;
          
          NSArray<PHAssetResource *> *resources = [PHAssetResource assetResourcesForAsset:asset];
          for (PHAssetResource *resource in resources) {
            exportSession.outputFileType = resource.uniformTypeIdentifier;
            if (exportSession.outputFileType != nil) break;
          }
          
          [exportSession exportAsynchronouslyWithCompletionHandler:^{
            if (exportSession.status == AVAssetExportSessionStatusCompleted) {
              firmetadata.contentType = [self utiToMimeType:exportSession.outputFileType];
              [self uploadFile:appDisplayName url:tempUrl firmetadata:firmetadata path:path resolver:resolve rejecter:reject];
              // TODO we're not cleaning up the temporary file at the moment, relying on the OS to do it
            } else {
              reject(@"storage/temporary-file-failure", @"Unable to create temporary file for upload.", nil);
            }
          }];
        } else {
          reject(@"storage/export-session-failure", @"Unable to create export session for asset.", nil);
        }
      }];
    }
  } else {
    if (![[NSFileManager defaultManager] fileExistsAtPath:localPath]) {
      reject(@"storage/file-not-found", @"File specified at path does not exist.", nil);
      return;
    }
    
    // TODO large files should not go through 'data', should use file directly
    // TODO heic conversion not working here UIImageJPEGRepresentation -> returns nil
    
    // BOOL isHeic = [self isHeic:localPath];
    NSData *data = [NSData dataWithContentsOfFile:localPath];
    
    if ([firmetadata valueForKey:@"contentType"] == nil) {
      firmetadata.contentType = [self mimeTypeForPath:localPath];
    }
    
    // if (isHeic) {
    //      UIImage *image = [UIImage imageWithData: data];
    //      data = UIImageJPEGRepresentation(image, 1);
    //      firmetadata.contentType = @"image/jpeg";
    // }
    
    [self uploadData:appDisplayName data:data firmetadata:firmetadata path:path resolver:resolve rejecter:reject];
  }
}

-(BOOL) isHeic: (NSString*) path {
  return [[path pathExtension] caseInsensitiveCompare:@"heic"] == NSOrderedSame;
}

- (NSString *)utiToMimeType:(NSString *) dataUTI {
  return (__bridge_transfer NSString *)UTTypeCopyPreferredTagWithClass((__bridge CFStringRef)dataUTI, kUTTagClassMIMEType);
}

- (NSURL *)temporaryFileUrl {
  NSString *filename = [NSString stringWithFormat:@"%@.tmp", [[NSProcessInfo processInfo] globallyUniqueString]];
  return [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:filename];
}

- (NSString*) mimeTypeForPath: (NSString *) path {
  CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)[path pathExtension], NULL);
  CFStringRef mimeType = UTTypeCopyPreferredTagWithClass (UTI, kUTTagClassMIMEType);
  CFRelease(UTI);
  
  if (!mimeType) {
    return @"application/octet-stream";
  }
  
  return (__bridge_transfer NSString *) mimeType;
}

- (void)uploadFile:(NSString *)appDisplayName url:(NSURL *)url firmetadata:(FIRStorageMetadata *)firmetadata path:(NSString *)path resolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject {
  FIRStorageReference *fileRef = [self getReference:path appDisplayName:appDisplayName];
  __block FIRStorageUploadTask *uploadTask;
  [EXUtilities performSynchronouslyOnMainThread:^{
    uploadTask = [fileRef putFile:url metadata:firmetadata];
  }];
  [self addUploadObservers:appDisplayName uploadTask:uploadTask path:path resolver:resolve rejecter:reject];
}

- (void)uploadData:(NSString *)appDisplayName data:(NSData *)data firmetadata:(FIRStorageMetadata *)firmetadata path:(NSString *)path resolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject {
  FIRStorageReference *fileRef = [self getReference:path appDisplayName:appDisplayName];
  __block FIRStorageUploadTask *uploadTask;
  [EXUtilities performSynchronouslyOnMainThread:^{
    uploadTask = [fileRef putData:data metadata:firmetadata];
  }];
  [self addUploadObservers:appDisplayName uploadTask:uploadTask path:path resolver:resolve rejecter:reject];
}

- (void)addUploadObservers:(NSString *)appDisplayName uploadTask:(FIRStorageUploadTask *)uploadTask path:(NSString *)path resolver:(EXPromiseResolveBlock)resolve rejecter:(EXPromiseRejectBlock)reject {
  // listen for state changes, errors, and completion of the upload.
  [uploadTask observeStatus:FIRStorageTaskStatusResume handler:^(FIRStorageTaskSnapshot *snapshot) {
    // upload resumed, also fires when the upload starts
    [self getUploadTaskAsDictionary:snapshot handler:^(NSDictionary *event) {
      [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_STATE_CHANGED props:event];
    }];
  }];
  
  [uploadTask observeStatus:FIRStorageTaskStatusPause handler:^(FIRStorageTaskSnapshot *snapshot) {
    // upload paused
    [self getUploadTaskAsDictionary:snapshot handler:^(NSDictionary *event) {
      [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_STATE_CHANGED props:event];
    }];
  }];
  [uploadTask observeStatus:FIRStorageTaskStatusProgress handler:^(FIRStorageTaskSnapshot *snapshot) {
    // upload reported progress
    [self getUploadTaskAsDictionary:snapshot handler:^(NSDictionary *event) {
      [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_STATE_CHANGED props:event];
    }];
  }];
  
  [uploadTask observeStatus:FIRStorageTaskStatusSuccess handler:^(FIRStorageTaskSnapshot *snapshot) {
    // upload completed successfully
    [self getUploadTaskAsDictionary:snapshot handler:^(NSDictionary *event) {
      [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_STATE_CHANGED props:event];
      [self sendJSEvent:appDisplayName type:STORAGE_EVENT path:path title:STORAGE_UPLOAD_SUCCESS props:event];
      resolve(event);
    }];
  }];
  
  [uploadTask observeStatus:FIRStorageTaskStatusFailure handler:^(FIRStorageTaskSnapshot *snapshot) {
    if (snapshot.error != nil) {
      [self promiseRejectStorageException:reject error:snapshot.error];
    }
  }];
}

- (FIRStorageReference *)getReference:(NSString *)path
                       appDisplayName:(NSString *)appDisplayName {
  FIRApp *firApp = [EXFirebaseAppUtil getApp:appDisplayName];
  if ([path hasPrefix:@"url::"]) {
    NSString *url = [path substringFromIndex:5];
    return [[FIRStorage storageForApp:firApp] referenceForURL:url];
  } else {
    return [[FIRStorage storageForApp:firApp] referenceWithPath:path];
  }
}

- (NSDictionary *)getDownloadTaskAsDictionary:(FIRStorageTaskSnapshot *)task {
  return @{@"bytesTransferred": @(task.progress.completedUnitCount), @"ref": task.reference.fullPath, @"state": [self getTaskStatus:task.status], @"totalBytes": @(task.progress.totalUnitCount)};
}

- (void)getUploadTaskAsDictionary:(FIRStorageTaskSnapshot *)task
                          handler:(void(^)(NSDictionary *))handler {
  [[task reference] downloadURLWithCompletion:^(NSURL * _Nullable URL, NSError * _Nullable error) {
    NSString *downloadUrl = [URL absoluteString];
    NSDictionary *metadata = [task.metadata dictionaryRepresentation];
    NSDictionary *dictionary = @{@"bytesTransferred": @(task.progress.completedUnitCount), @"downloadURL": downloadUrl != nil ? downloadUrl : [NSNull null], @"metadata": metadata != nil ? metadata : [NSNull null], @"ref": task.reference.fullPath, @"state": [self getTaskStatus:task.status], @"totalBytes": @(task.progress.totalUnitCount)};
    handler(dictionary);
  }];
}

- (FIRStorageMetadata *)buildMetadataFromMap:(NSDictionary *)metadata {
  FIRStorageMetadata *storageMetadata = [[FIRStorageMetadata alloc] initWithDictionary:metadata];
  storageMetadata.customMetadata = [metadata[@"customMetadata"] mutableCopy];
  return storageMetadata;
}

- (NSString *)getTaskStatus:(FIRStorageTaskStatus)status {
  if (status == FIRStorageTaskStatusResume || status == FIRStorageTaskStatusProgress) {
    return @"running";
  } else if (status == FIRStorageTaskStatusPause) {
    return @"paused";
  } else if (status == FIRStorageTaskStatusSuccess) {
    return @"success";
  } else if (status == FIRStorageTaskStatusFailure) {
    return @"error";
  } else {
    return @"unknown";
  }
}

- (NSString *)getPathForDirectory:(int)directory {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(directory, NSUserDomainMask, YES);
  return [paths firstObject];
}

- (NSDictionary *)constantsToExport {
  return @{
           @"MAIN_BUNDLE_PATH": [[NSBundle mainBundle] bundlePath],
           @"CACHES_DIRECTORY_PATH": [self getPathForDirectory:NSCachesDirectory],
           @"DOCUMENT_DIRECTORY_PATH": [self getPathForDirectory:NSDocumentDirectory],
           @"EXTERNAL_DIRECTORY_PATH": [NSNull null],
           @"EXTERNAL_STORAGE_DIRECTORY_PATH": [NSNull null],
           @"TEMP_DIRECTORY_PATH": NSTemporaryDirectory(),
           @"LIBRARY_DIRECTORY_PATH": [self getPathForDirectory:NSLibraryDirectory],
           @"FILETYPE_REGULAR": NSFileTypeRegular,
           @"FILETYPE_DIRECTORY": NSFileTypeDirectory
           };
}

- (void)sendJSError:(NSString *)appDisplayName error:(NSError *)error path:(NSString *)path {
  NSDictionary *evt = @{@"path": path, @"message": [error debugDescription]};
  [self sendJSEvent:appDisplayName type:STORAGE_ERROR path:path title:STORAGE_ERROR props:evt];
}

- (void)sendJSEvent:(NSString *)appDisplayName type:(NSString *)type path:(NSString *)path title:(NSString *)title props:(NSDictionary *)props {
  [EXFirebaseAppUtil sendJSEvent:self.eventEmitter name:type body:@{@"eventName": title, @"appName": appDisplayName, @"path": path, @"body": props}];
}

/**
 Reject a promise with a storage exception
 
 @param reject EXPromiseRejectBlock
 @param error NSError
 */
- (void)promiseRejectStorageException:(EXPromiseRejectBlock)reject error:(NSError *)error {
  NSString *code = @"storage/unknown";
  NSString *message = [error localizedDescription];
  
  NSDictionary *userInfo = [error userInfo];
  NSError *underlyingError = userInfo[NSUnderlyingErrorKey];
  NSString *underlyingErrorDescription = [underlyingError localizedDescription];
  
  switch (error.code) {
    case FIRStorageErrorCodeUnknown:
      if ([underlyingErrorDescription isEqualToString:@"The operation couldn’t be completed. Permission denied"]) {
        code = @"storage/invalid-device-file-path";
        message = @"The specified device file path is invalid or is restricted.";
      } else {
        code = @"storage/unknown";
        message = @"An unknown error has occurred.";
      }
      break;
    case FIRStorageErrorCodeObjectNotFound:
      code = @"storage/object-not-found";
      message = @"No object exists at the desired reference.";
      break;
    case FIRStorageErrorCodeBucketNotFound:
      code = @"storage/bucket-not-found";
      message = @"No bucket is configured for Firebase Storage.";
      break;
    case FIRStorageErrorCodeProjectNotFound:
      code = @"storage/project-not-found";
      message = @"No project is configured for Firebase Storage.";
      break;
    case FIRStorageErrorCodeQuotaExceeded:
      code = @"storage/quota-exceeded";
      message = @"Quota on your Firebase Storage bucket has been exceeded.";
      break;
    case FIRStorageErrorCodeUnauthenticated:
      code = @"storage/unauthenticated";
      message = @"User is unauthenticated. Authenticate and try again.";
      break;
    case FIRStorageErrorCodeUnauthorized:
      code = @"storage/unauthorized";
      message = @"User is not authorized to perform the desired action.";
      break;
    case FIRStorageErrorCodeRetryLimitExceeded:
      code = @"storage/retry-limit-exceeded";
      message = @"The maximum time limit on an operation (upload, download, delete, etc.) has been exceeded.";
      break;
    case FIRStorageErrorCodeNonMatchingChecksum:
      code = @"storage/non-matching-checksum";
      message = @"File on the client does not match the checksum of the file received by the server.";
      break;
    case FIRStorageErrorCodeDownloadSizeExceeded:
      code = @"storage/download-size-exceeded";
      message = @"Size of the downloaded file exceeds the amount of memory allocated for the download.";
      break;
    case FIRStorageErrorCodeCancelled:
      code = @"storage/cancelled";
      message = @"User cancelled the operation.";
      break;
    default:
      break;
  }
  
  if (userInfo != nil && userInfo[@"data"]) {
    // errors with 'data' are unserializable - it breaks react so we send nil instead
    reject(code, message, nil);
  } else {
    reject(code, message, error);
  }
}

#pragma mark - EXEventEmitter

- (NSArray<NSString *> *)supportedEvents {
  return @[STORAGE_EVENT, STORAGE_ERROR];
}

- (void)startObserving {
  
}

- (void)stopObserving
{
  
}

@end
