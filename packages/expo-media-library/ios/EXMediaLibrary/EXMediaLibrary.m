// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <PhotosUI/PhotosUI.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreServices/CoreServices.h>

#import <EXMediaLibrary/EXMediaLibrary.h>
#import <EXMediaLibrary/EXSaveToLibraryDelegate.h>
#import <EXMediaLibrary/EXMediaLibraryMediaLibraryPermissionRequester.h>
#import <EXMediaLibrary/EXMediaLibraryMediaLibraryWriteOnlyPermissionRequester.h>

#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXUtilities.h>
#import <ExpoModulesCore/EXEventEmitterService.h>

#import <ExpoModulesCore/EXFileSystemInterface.h>
#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

NSString *const EXAssetMediaTypeAudio = @"audio";
NSString *const EXAssetMediaTypePhoto = @"photo";
NSString *const EXAssetMediaTypeVideo = @"video";
NSString *const EXAssetMediaTypeUnknown = @"unknown";
NSString *const EXAssetMediaTypeAll = @"all";

NSString *const EXMediaLibraryDidChangeEvent = @"mediaLibraryDidChange";

NSString *const EXMediaLibraryCachesDirectory = @"MediaLibrary";

NSString *const EXMediaLibraryShouldDownloadFromNetworkKey = @"shouldDownloadFromNetwork";

@interface EXMediaLibrary ()

@property (nonatomic, strong) PHFetchResult *allAssetsFetchResult;
@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<EXFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<EXEventEmitterService> eventEmitter;
@property (nonatomic, strong) NSMutableSet *saveToLibraryDelegates;

@end

@implementation EXMediaLibrary

EX_EXPORT_MODULE(ExpoMediaLibrary);

- (instancetype) init
{
  if (self = [super init]) {
    _saveToLibraryDelegates = [NSMutableSet new];
  }
  return self;
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(EXFileSystemInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(EXEventEmitterService)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  [EXPermissionsMethodsDelegate registerRequesters:@[[EXMediaLibraryMediaLibraryPermissionRequester new], [EXMediaLibraryMediaLibraryWriteOnlyPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("host.exp.exponent.MediaLibrary", DISPATCH_QUEUE_SERIAL);
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"MediaType": @{
               @"audio": EXAssetMediaTypeAudio,
               @"photo": EXAssetMediaTypePhoto,
               @"video": EXAssetMediaTypeVideo,
               @"unknown": EXAssetMediaTypeUnknown,
               @"all": EXAssetMediaTypeAll,
               },
           @"SortBy": @{
               @"default": @"default",
               @"creationTime": @"creationTime",
               @"modificationTime": @"modificationTime",
               @"mediaType": @"mediaType",
               @"width": @"width",
               @"height": @"height",
               @"duration": @"duration",
               },
           @"CHANGE_LISTENER_NAME": EXMediaLibraryDidChangeEvent,
           };
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[EXMediaLibraryDidChangeEvent];
}

- (id)requesterClass:(BOOL)writeOnly
{
  if (writeOnly) {
    return [EXMediaLibraryMediaLibraryWriteOnlyPermissionRequester class];
  } else {
    return [EXMediaLibraryMediaLibraryPermissionRequester class];
  }
}

EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(BOOL)writeOnly
                    resolve:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[self requesterClass:writeOnly]
                                                            resolve:resolve
                                                             reject:reject];
}

EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(BOOL)writeOnly
                    resolve:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[self requesterClass:writeOnly]
                                                               resolve:resolve
                                                                reject:reject];
}

EX_EXPORT_METHOD_AS(presentPermissionsPickerAsync,
                    presentPermissionsPickerAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
#ifdef __IPHONE_14_0
  if (@available(iOS 14, *)) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[PHPhotoLibrary sharedPhotoLibrary] presentLimitedLibraryPickerFromViewController:[[[[UIApplication sharedApplication] delegate] window] rootViewController]];
      resolve(nil);
    });
  } else {
#endif
    reject(@"ERR_METHOD_UNAVAILABLE", @"presentLimitedLibraryPickerAsync is only available on iOS >= 14.", nil);
#ifdef __IPHONE_14_0 
  }
#endif
}

EX_EXPORT_METHOD_AS(createAssetAsync,
                    createAssetFromLocalUri:(nonnull NSString *)localUri
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  if ([[localUri pathExtension] length] == 0) {
    reject(@"E_NO_FILE_EXTENSION", @"Could not get the file's extension.", nil);
    return;
  }
  
  PHAssetMediaType assetType = [EXMediaLibrary _assetTypeForUri:localUri];
  if (assetType == PHAssetMediaTypeUnknown || assetType == PHAssetMediaTypeAudio) {
    reject(@"E_UNSUPPORTED_ASSET", @"This file type is not supported yet", nil);
    return;
  }
  
  NSURL *assetUrl = [self.class _normalizeAssetURLFromUri:localUri];
  if (assetUrl == nil) {
    reject(@"E_INVALID_URI", @"Provided localUri is not a valid URI", nil);
    return;
  }
  
  if (!([_fileSystem permissionsForURI:assetUrl] & EXFileSystemPermissionRead)) {
    reject(@"E_FILESYSTEM_PERMISSIONS", [NSString stringWithFormat:@"File '%@' isn't readable.", assetUrl], nil);
    return;
  }
  
  __block PHObjectPlaceholder *assetPlaceholder;
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
    PHAssetChangeRequest *changeRequest = assetType == PHAssetMediaTypeVideo
                                        ? [PHAssetChangeRequest creationRequestForAssetFromVideoAtFileURL:assetUrl]
                                        : [PHAssetChangeRequest creationRequestForAssetFromImageAtFileURL:assetUrl];
    
    assetPlaceholder = changeRequest.placeholderForCreatedAsset;
    
  } completionHandler:^(BOOL success, NSError *error) {
    if (success) {
      PHAsset *asset = [EXMediaLibrary _getAssetById:assetPlaceholder.localIdentifier];
      resolve([EXMediaLibrary _exportAsset:asset]);
    } else {
      reject(@"E_ASSET_SAVE_FAILED", @"Asset couldn't be saved to photo library", error);
    }
  }];
}

EX_EXPORT_METHOD_AS(saveToLibraryAsync,
                    saveToLibraryAsync:(nonnull NSString *)localUri
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSPhotoLibraryAddUsageDescription"] == nil) {
    return reject(@"E_NO_PERMISSIONS", @"This app is missing NSPhotoLibraryAddUsageDescription. Add this entry to your bundle's Info.plist.", nil);
  }
  
  if ([[localUri pathExtension] length] == 0) {
    reject(@"E_NO_FILE_EXTENSION", @"Could not get the file's extension.", nil);
    return;
  }
  
  PHAssetMediaType assetType = [EXMediaLibrary _assetTypeForUri:localUri];
  NSURL *assetUrl = [self.class _normalizeAssetURLFromUri:localUri];
  EX_WEAKIFY(self)
  __block EXSaveToLibraryDelegate *delegate = [EXSaveToLibraryDelegate new];
  [_saveToLibraryDelegates addObject:delegate];
  EXSaveToLibraryCallback callback = ^(id asset, NSError *error){
    EX_STRONGIFY(self)
    [self.saveToLibraryDelegates removeObject:delegate];
    if (error) {
      return reject(@"E_SAVE_FAILED", [error localizedDescription], nil);
    }
    return resolve(nil);
  };
  
  if (assetType == PHAssetMediaTypeImage) {
    UIImage *image = [UIImage imageWithData:[NSData dataWithContentsOfURL:assetUrl]];
    if (image == nil) {
      return reject(@"E_FILE_IS_MISSING", [NSString stringWithFormat:@"Couldn't open file: %@. Make sure if this file exists.", localUri], nil);
    }
    return [delegate writeImage:image withCallback:callback];
  } else if (assetType == PHAssetMediaTypeVideo) {
    if (UIVideoAtPathIsCompatibleWithSavedPhotosAlbum([assetUrl path])) {
      return [delegate writeVideo:[assetUrl path] withCallback:callback];
    }
    return reject(@"E_COULD_NOT_SAVE_VIDEO", @"This video couldn't be saved to the Camera Roll album.", nil);
  }
  
  return reject(@"E_UNSUPPORTED_ASSET", @"This file type is not supported yet.", nil);
}

EX_EXPORT_METHOD_AS(addAssetsToAlbumAsync,
                    addAssets:(NSArray<NSString *> *)assetIds
                    toAlbum:(nonnull NSString *)albumId
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [self _runIfAllPermissionsWereGranted:reject block:^{
    [EXMediaLibrary _addAssets:assetIds toAlbum:albumId withCallback:^(BOOL success, NSError *error) {
      if (error) {
        reject(@"E_ADD_TO_ALBUM_FAILED", @"Couldn\'t add assets to album", error);
      } else {
        resolve(@(success));
      }
    }];
  }];
}

EX_EXPORT_METHOD_AS(removeAssetsFromAlbumAsync,
                    removeAssets:(NSArray<NSString *> *)assetIds
                    fromAlbum:(nonnull NSString *)albumId
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [self _runIfAllPermissionsWereGranted:reject block:^{
    [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
      PHAssetCollection *collection = [EXMediaLibrary _getAlbumById:albumId];
      PHFetchResult *assets = [EXMediaLibrary _getAssetsByIds:assetIds];
      
      PHFetchResult *collectionAssets = [PHAsset fetchAssetsInAssetCollection:collection options:nil];
      PHAssetCollectionChangeRequest *albumChangeRequest = [PHAssetCollectionChangeRequest changeRequestForAssetCollection:collection assets:collectionAssets];
      
      [albumChangeRequest removeAssets:assets];
      
    } completionHandler:^(BOOL success, NSError *error) {
      if (error) {
        reject(@"E_REMOVE_FROM_ALBUM_FAILED", @"Couldn\'t remove assets from album", error);
      } else {
        resolve(@(success));
      }
    }];
  }];
}

EX_EXPORT_METHOD_AS(deleteAssetsAsync,
                    deleteAssets:(NSArray<NSString *>*)assetIds
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
    PHFetchResult *fetched = [PHAsset fetchAssetsWithLocalIdentifiers:assetIds options:nil];
    [PHAssetChangeRequest deleteAssets:fetched];
    
  } completionHandler:^(BOOL success, NSError *error) {
    if (success == YES) {
      resolve(@(success));
    } else {
      reject(@"E_ASSET_REMOVE_FAILED", @"Couldn't remove assets", error);
    }
  }];
}

EX_EXPORT_METHOD_AS(getAlbumsAsync,
                    getAlbumsWithOptions:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [self _runIfAllPermissionsWereGranted:reject block:^{
    NSMutableArray<NSDictionary *> *albums = [NSMutableArray new];
    
    PHFetchOptions *fetchOptions = [PHFetchOptions new];
    fetchOptions.includeHiddenAssets = NO;
    fetchOptions.includeAllBurstAssets = NO;
    
    PHFetchResult *userAlbumsFetchResult = [PHCollectionList fetchTopLevelUserCollectionsWithOptions:fetchOptions];
    [albums addObjectsFromArray:[EXMediaLibrary _exportCollections:userAlbumsFetchResult withFetchOptions:fetchOptions inFolder:nil]];

    if ([options[@"includeSmartAlbums"] boolValue]) {
      PHFetchResult<PHAssetCollection *> *smartAlbumsFetchResult =
      [PHAssetCollection fetchAssetCollectionsWithType:PHAssetCollectionTypeSmartAlbum
                                               subtype:PHAssetCollectionSubtypeAny
                                               options:fetchOptions];
      [albums addObjectsFromArray:[EXMediaLibrary _exportCollections:smartAlbumsFetchResult withFetchOptions:fetchOptions inFolder:nil]];
    }
    
    resolve(albums);
  }];
}

EX_EXPORT_METHOD_AS(getMomentsAsync,
                    getMoments:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  PHFetchOptions *options = [PHFetchOptions new];
  options.includeHiddenAssets = NO;
  options.includeAllBurstAssets = NO;
  
  PHFetchResult *fetchResult = [PHAssetCollection fetchMomentsWithOptions:options];
  NSArray<NSDictionary *> *albums = [EXMediaLibrary _exportCollections:fetchResult withFetchOptions:options inFolder:nil];
  
  resolve(albums);
}

EX_EXPORT_METHOD_AS(getAlbumAsync,
                    getAlbumWithTitle:(nonnull NSString *)title
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [self _runIfAllPermissionsWereGranted:reject block:^{
    PHAssetCollection *collection = [EXMediaLibrary _getAlbumWithTitle:title];
    resolve(EXNullIfNil([EXMediaLibrary _exportCollection:collection]));
  }];
}

EX_EXPORT_METHOD_AS(createAlbumAsync,
                    createAlbumWithTitle:(nonnull NSString *)title
                    withAssetId:(NSString *)assetId
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [self _runIfAllPermissionsWereGranted:reject block:^{
    [EXMediaLibrary _createAlbumWithTitle:title completion:^(PHAssetCollection *collection, NSError *error) {
      if (collection) {
        if (assetId) {
          [EXMediaLibrary _addAssets:@[assetId] toAlbum:collection.localIdentifier withCallback:^(BOOL success, NSError *error) {
            if (success) {
              resolve(EXNullIfNil([EXMediaLibrary _exportCollection:collection]));
            } else {
              reject(@"E_ALBUM_CANT_ADD_ASSET", @"Unable to add asset to the new album", error);
            }
          }];
        } else {
          resolve(EXNullIfNil([EXMediaLibrary _exportCollection:collection]));
        }
      } else {
        reject(@"E_ALBUM_CREATE_FAILED", @"Could not create album", error);
      }
    }];
  }];
}

  
EX_EXPORT_METHOD_AS(deleteAlbumsAsync,
                    deleteAlbums:(nonnull NSArray<NSString *>*)albumIds
                    assetRemove:(NSNumber *)assetRemove
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [self _runIfAllPermissionsWereGranted:reject block:^{
    PHFetchResult *collections = [EXMediaLibrary _getAlbumsById:albumIds];
    [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
      if (assetRemove) {
        for (PHAssetCollection *collection in collections) {
          PHFetchResult *fetch = [PHAsset fetchAssetsInAssetCollection:collection options:nil];
          [PHAssetChangeRequest deleteAssets:fetch];
        }
      }
      [PHAssetCollectionChangeRequest deleteAssetCollections:collections];
    } completionHandler:^(BOOL success, NSError * _Nullable error) {
      if (success == YES) {
        resolve(@(success));
      } else {
        reject(@"E_ALBUM_DELETE_FAILED", @"Could not delete album", error);
      }
    }];
  }];
}
  
EX_EXPORT_METHOD_AS(getAssetInfoAsync,
                    getAssetInfo:(nonnull NSString *)assetId
                    withOptions:(nonnull NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  PHAsset *asset = [EXMediaLibrary _getAssetById:assetId];
    
  BOOL shouldDownloadFromNetwork = [options objectForKey:EXMediaLibraryShouldDownloadFromNetworkKey] != nil
    ? [[options objectForKey:EXMediaLibraryShouldDownloadFromNetworkKey] boolValue]
    : YES;
  
  if (asset) {
    NSMutableDictionary *result = [EXMediaLibrary _exportAssetInfo:asset];
    if (asset.mediaType == PHAssetMediaTypeImage) {
      PHContentEditingInputRequestOptions *options = [PHContentEditingInputRequestOptions new];
      options.networkAccessAllowed = shouldDownloadFromNetwork;

      [asset requestContentEditingInputWithOptions:options
                                 completionHandler:^(PHContentEditingInput * _Nullable contentEditingInput, NSDictionary * _Nonnull info) {
        result[@"localUri"] = [contentEditingInput.fullSizeImageURL absoluteString];
        result[@"orientation"] = @(contentEditingInput.fullSizeImageOrientation);
        if (!shouldDownloadFromNetwork) {
          result[@"isNetworkAsset"] = [info objectForKey:PHContentEditingInputResultIsInCloudKey] != nil
            ? @([[info objectForKey:PHContentEditingInputResultIsInCloudKey] boolValue])
            : @(NO);
        }
        
        CIImage *ciImage = [CIImage imageWithContentsOfURL:contentEditingInput.fullSizeImageURL];
        result[@"exif"] = ciImage.properties;
        resolve(result);
      }];
    } else {
      PHVideoRequestOptions *options = [PHVideoRequestOptions new];
      options.networkAccessAllowed = shouldDownloadFromNetwork;

      [[PHImageManager defaultManager] requestAVAssetForVideo:asset
                                                      options:options
                                                resultHandler:^(AVAsset * _Nullable asset, AVAudioMix * _Nullable audioMix, NSDictionary * _Nullable info) {
        // Slow motion videos are returned as an AVComposition instance
        if ([asset isKindOfClass:[AVComposition class]]) {
            NSString *directory = [self.fileSystem.cachesDirectory stringByAppendingPathComponent:EXMediaLibraryCachesDirectory];
            [self.fileSystem ensureDirExistsWithPath:directory];
            NSString *videoOutputFileName = [NSString stringWithFormat:@"slowMoVideo-%d.mov",arc4random() % 1000];
            NSString *videoFileOutputPath = [directory stringByAppendingPathComponent:videoOutputFileName];
            NSURL *videoFileOutputURL = [NSURL fileURLWithPath:videoFileOutputPath];
            
            AVAssetExportSession *exporter = [[AVAssetExportSession alloc] initWithAsset:asset presetName:AVAssetExportPresetHighestQuality];
            exporter.outputURL = videoFileOutputURL;
            exporter.outputFileType = AVFileTypeQuickTimeMovie;
            exporter.shouldOptimizeForNetworkUse = YES;
                                
            [exporter exportAsynchronouslyWithCompletionHandler:^{
                if (exporter.status == AVAssetExportSessionStatusCompleted) {
                    result[@"localUri"] = videoFileOutputURL.absoluteString;
                    if (!shouldDownloadFromNetwork) {
                      result[@"isNetworkAsset"] = [info objectForKey:PHImageResultIsInCloudKey] != nil
                        ? [info objectForKey:PHImageResultIsInCloudKey]
                        : @(NO);
                    }
                    resolve(result);
                } else if (exporter.status == AVAssetExportSessionStatusFailed) {
                    reject(@"E_EXPORT_FAILED", @"Could not export the requested video.", nil);
                } else if (exporter.status == AVAssetExportSessionStatusCancelled) {
                    reject(@"E_EXPORT_CANCELLED", @"The video export operation is cancelled", nil);
                }
            }];
            
        } else {
            AVURLAsset *urlAsset = (AVURLAsset *)asset;
            result[@"localUri"] = [[urlAsset URL] absoluteString];
            if (!shouldDownloadFromNetwork) {
              result[@"isNetworkAsset"] = [info objectForKey:PHImageResultIsInCloudKey] != nil
                ? [info objectForKey:PHImageResultIsInCloudKey]
                : @(NO);
            }
            resolve(result);
        }
      }];
    }
  } else {
    resolve([NSNull null]);
  }
}

EX_EXPORT_METHOD_AS(getAssetsAsync,
                    getAssetsWithOptions:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  // options
  NSString *after = options[@"after"];
  NSInteger first = [options[@"first"] integerValue] ?: 20;
  NSArray<NSString *> *mediaType = options[@"mediaType"];
  NSArray *sortBy = options[@"sortBy"];
  NSDate *createdAfter = [EXUtilities NSDate:options[@"createdAfter"]];
  NSDate *createdBefore = [EXUtilities NSDate:options[@"createdBefore"]];
  NSString *albumId = options[@"album"];

  if (albumId) {
    [self _runIfAllPermissionsWereGranted:reject block:^{
      PHAssetCollection *collection = [EXMediaLibrary _getAlbumById:albumId];
      
      if (!collection) {
        reject(@"E_ALBUM_NOT_FOUND", @"Couldn't find album", nil);
        return;
      }
      
      [EXMediaLibrary _getAssetsWithAfter:after
                                    first:first
                                mediaType:mediaType
                                   sortBy:sortBy
                             createdAfter:createdAfter
                            createdBefore:createdBefore
                               collection:collection
                                  resolve:resolve
                                   reject:reject];
    }];
  } else {
    [EXMediaLibrary _getAssetsWithAfter:after
                                  first:first
                              mediaType:mediaType
                                 sortBy:sortBy
                           createdAfter:createdAfter
                          createdBefore:createdBefore
                             collection:nil
                                resolve:resolve
                                 reject:reject];
  }
}

# pragma mark - PHPhotoLibraryChangeObserver

- (void)startObserving
{
  _allAssetsFetchResult = [EXMediaLibrary _getAllAssets];
  [[PHPhotoLibrary sharedPhotoLibrary] registerChangeObserver:self];
}

- (void)stopObserving
{
  _allAssetsFetchResult = nil;
  [[PHPhotoLibrary sharedPhotoLibrary] unregisterChangeObserver:self];
}

- (void)photoLibraryDidChange:(PHChange *)changeInstance
{
  if (changeInstance != nil && _allAssetsFetchResult != nil) {
    PHFetchResultChangeDetails *changeDetails = [changeInstance changeDetailsForFetchResult:_allAssetsFetchResult];
    
    if (changeDetails != nil) {
      _allAssetsFetchResult = changeDetails.fetchResultAfterChanges;
      
      // PHPhotoLibraryChangeObserver is calling this method too often, so we need to filter out some calls before they are sent to JS.
      // Ultimately, we emit an event when something has been inserted or removed from the library, or the user changed the permissions.
      if (changeDetails.hasIncrementalChanges && (changeDetails.insertedObjects.count > 0 || changeDetails.removedObjects.count > 0)) {
        NSMutableArray *insertedAssets = [NSMutableArray new];
        NSMutableArray *deletedAssets = [NSMutableArray new];
        NSMutableArray *updatedAssets = [NSMutableArray new];
        NSDictionary *body = @{
                               @"hasIncrementalChanges": @(true),
                               @"insertedAssets": insertedAssets,
                               @"deletedAssets": deletedAssets,
                               @"updatedAssets": updatedAssets
                               };
        
        for (PHAsset *asset in changeDetails.insertedObjects) {
          [insertedAssets addObject:[EXMediaLibrary _exportAsset:asset]];
        }
        for (PHAsset *asset in changeDetails.removedObjects) {
          [deletedAssets addObject:[EXMediaLibrary _exportAsset:asset]];
        }
        for (PHAsset *asset in changeDetails.changedObjects) {
          [updatedAssets addObject:[EXMediaLibrary _exportAsset:asset]];
        }
        
        [_eventEmitter sendEventWithName:EXMediaLibraryDidChangeEvent body:body];
        return;
      }
      
      // Emit event when the scope of changes were too large and incremental changes could not be provided.
      // For example, when the user changed the limited permissions.
      if (!changeDetails.hasIncrementalChanges) {
        [_eventEmitter sendEventWithName:EXMediaLibraryDidChangeEvent body:@{
          @"hasIncrementalChanges": @(false)
        }];
      }
    }
  }
}


# pragma mark - Internal methods

+ (void)_getAssetsWithAfter:(NSString *)after
                      first:(NSInteger)first
                  mediaType:(NSArray<NSString *> *)mediaType
                     sortBy:(NSArray *)sortBy
               createdAfter:(NSDate *)createdAfter
              createdBefore:(NSDate *)createdBefore
                 collection:(PHAssetCollection *)collection
                    resolve:(EXPromiseResolveBlock)resolve
                     reject:(EXPromiseRejectBlock)reject
{
  PHFetchOptions *fetchOptions = [PHFetchOptions new];
  NSMutableArray<NSPredicate *> *predicates = [NSMutableArray new];
  NSMutableDictionary *response = [NSMutableDictionary new];
  NSMutableArray<NSDictionary *> *assets = [NSMutableArray new];
  
  PHAsset *cursor;
  if (after) {
    cursor = [EXMediaLibrary _getAssetById:after];
    
    if (!cursor) {
      reject(@"E_CURSOR_NOT_FOUND", @"Couldn't find cursor", nil);
      return;
    }
  }

  if (mediaType && [mediaType count] > 0) {
    NSMutableArray<NSNumber *> *assetTypes = [EXMediaLibrary _convertMediaTypes:mediaType];
    
    if ([assetTypes count] > 0) {
      NSPredicate *predicate = [NSPredicate predicateWithFormat:@"mediaType IN %@", assetTypes];
      [predicates addObject:predicate];
    }
  }
  
  if (sortBy && sortBy.count > 0) {
    fetchOptions.sortDescriptors = [EXMediaLibrary _prepareSortDescriptors:sortBy];
  }

  if (createdAfter) {
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"creationDate > %@", createdAfter];
    [predicates addObject:predicate];
  }

  if (createdBefore) {
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"creationDate < %@", createdBefore];
    [predicates addObject:predicate];
  }
  
  if (predicates.count > 0) {
    NSCompoundPredicate *compoundPredicate = [NSCompoundPredicate andPredicateWithSubpredicates:predicates];
    fetchOptions.predicate = compoundPredicate;
  }
  
  fetchOptions.includeAssetSourceTypes = PHAssetSourceTypeUserLibrary;
  fetchOptions.includeAllBurstAssets = NO;
  fetchOptions.includeHiddenAssets = NO;
  
  PHFetchResult *fetchResult = collection
    ? [PHAsset fetchAssetsInAssetCollection:collection options:fetchOptions]
    : [PHAsset fetchAssetsWithOptions:fetchOptions];
  
  NSInteger cursorIndex = cursor ? [fetchResult indexOfObject:cursor] : NSNotFound;
  NSInteger totalCount = fetchResult.count;
  BOOL hasNextPage;
  
  // If we don't use any sort descriptors, the assets are sorted just like in Photos app.
  // That means they are in the insertion order, so the most recent assets are at the end.
  // Therefore, we need to reverse indexes to place them at the beginning.
  if (fetchOptions.sortDescriptors.count == 0) {
    NSInteger startIndex = MAX(cursorIndex == NSNotFound ? totalCount - 1 : cursorIndex - 1, -1);
    NSInteger endIndex = MAX(startIndex - first + 1, 0);
    
    for (NSInteger i = startIndex; i >= endIndex; i--) {
      PHAsset *asset = [fetchResult objectAtIndex:i];
      [assets addObject:[EXMediaLibrary _exportAsset:asset]];
    }
    
    hasNextPage = endIndex > 0;
  } else {
    NSInteger startIndex = cursorIndex == NSNotFound ? 0 : cursorIndex + 1;
    NSInteger endIndex = MIN(startIndex + first, totalCount);
    
    for (NSInteger i = startIndex; i < endIndex; i++) {
      PHAsset *asset = [fetchResult objectAtIndex:i];
      [assets addObject:[EXMediaLibrary _exportAsset:asset]];
    }
    hasNextPage = endIndex < totalCount - 1;
  }
  
  NSDictionary *lastAsset = [assets lastObject];
  
  response[@"assets"] = assets;
  response[@"endCursor"] = lastAsset ? lastAsset[@"id"] : after;
  response[@"hasNextPage"] = @(hasNextPage);
  response[@"totalCount"] = @(totalCount);
  
  resolve(response);
}

+ (PHFetchResult *)_getAllAssets
{
  PHFetchOptions *options = [PHFetchOptions new];
  options.includeAssetSourceTypes = PHAssetSourceTypeUserLibrary;
  options.includeHiddenAssets = NO;
  options.includeAllBurstAssets = NO;
  return [PHAsset fetchAssetsWithOptions:options];
}

+ (PHFetchResult *)_getAssetsByIds:(NSArray<NSString *> *)assetIds
{
  PHFetchOptions *options = [PHFetchOptions new];
  options.includeHiddenAssets = YES;
  options.includeAllBurstAssets = YES;
  options.fetchLimit = assetIds.count;
  return [PHAsset fetchAssetsWithLocalIdentifiers:assetIds options:options];
}

+ (PHAsset *)_getAssetById:(NSString *)assetId
{
  if (assetId) {
    return [EXMediaLibrary _getAssetsByIds:@[assetId]].firstObject;
  }
  return nil;
}

+ (PHAssetCollection *)_getAlbumWithTitle:(nonnull NSString *)title
{
  PHFetchOptions *options = [PHFetchOptions new];
  options.predicate = [NSPredicate predicateWithFormat:@"title == %@", title];
  options.fetchLimit = 1;
  
  PHFetchResult *fetchResult = [PHAssetCollection
                                fetchAssetCollectionsWithType:PHAssetCollectionTypeAlbum
                                subtype:PHAssetCollectionSubtypeAny
                                options:options];

  return fetchResult.firstObject;
}

+ (PHFetchResult *)_getAlbumsById:(NSArray<NSString *>*)albumIds
{
  PHFetchOptions *options = [PHFetchOptions new];
  return [PHAssetCollection fetchAssetCollectionsWithLocalIdentifiers:albumIds options:options];
}


+ (PHAssetCollection *)_getAlbumById:(nonnull NSString *)albumId
{
  PHFetchOptions *options = [PHFetchOptions new];
  options.fetchLimit = 1;
  return [PHAssetCollection fetchAssetCollectionsWithLocalIdentifiers:@[albumId] options:options].firstObject;
}

+ (void)_ensureAlbumWithTitle:(nonnull NSString *)title completion:(void(^)(PHAssetCollection *collection, NSError *error))completion
{
  PHAssetCollection *collection = [EXMediaLibrary _getAlbumWithTitle:title];
  
  if (collection) {
    completion(collection, nil);
    return;
  }
  
  [EXMediaLibrary _createAlbumWithTitle:title completion:completion];
}

+ (void)_createAlbumWithTitle:(nonnull NSString *)title completion:(void(^)(PHAssetCollection *collection, NSError *error))completion
{
  __block PHObjectPlaceholder *collectionPlaceholder;
  
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
    PHAssetCollectionChangeRequest *changeRequest = [PHAssetCollectionChangeRequest creationRequestForAssetCollectionWithTitle:title];
    collectionPlaceholder = changeRequest.placeholderForCreatedAssetCollection;
    
  } completionHandler:^(BOOL success, NSError *error) {
    if (success) {
      PHFetchResult *fetchResult = [PHAssetCollection fetchAssetCollectionsWithLocalIdentifiers:@[collectionPlaceholder.localIdentifier] options:nil];
      completion(fetchResult.firstObject, nil);
    } else {
      completion(nil, error);
    }
  }];
}

+ (void)_addAssets:(NSArray<NSString *> *)assetIds toAlbum:(nonnull NSString *)albumId withCallback:(void(^)(BOOL success, NSError *error))callback
{
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
    PHAssetCollection *collection = [EXMediaLibrary _getAlbumById:albumId];
    PHFetchResult *assets = [EXMediaLibrary _getAssetsByIds:assetIds];
    
    PHFetchResult *collectionAssets = [PHAsset fetchAssetsInAssetCollection:collection options:nil];
    PHAssetCollectionChangeRequest *albumChangeRequest = [PHAssetCollectionChangeRequest changeRequestForAssetCollection:collection assets:collectionAssets];
    
    [albumChangeRequest addAssets:assets];
  } completionHandler:callback];
}

+ (NSDictionary *)_exportAsset:(PHAsset *)asset
{
  if (asset) {
    NSString *fileName = [asset valueForKey:@"filename"];

    return @{
             @"id": asset.localIdentifier,
             @"filename": EXNullIfNil(fileName),
             @"uri": [EXMediaLibrary _assetUriForLocalId:asset.localIdentifier],
             @"mediaType": [EXMediaLibrary _stringifyMediaType:asset.mediaType],
             @"mediaSubtypes": [EXMediaLibrary _stringifyMediaSubtypes:asset.mediaSubtypes],
             @"width": @(asset.pixelWidth),
             @"height": @(asset.pixelHeight),
             @"creationTime": [EXMediaLibrary _exportDate:asset.creationDate],
             @"modificationTime": [EXMediaLibrary _exportDate:asset.modificationDate],
             @"duration": @(asset.duration),
             };
  }
  return nil;
}

+ (NSMutableDictionary *)_exportAssetInfo:(PHAsset *)asset
{
  NSMutableDictionary *assetDict = [[EXMediaLibrary _exportAsset:asset] mutableCopy];
  
  if (assetDict) {
    assetDict[@"location"] = [EXMediaLibrary _exportLocation:asset.location];
    assetDict[@"isFavorite"] = @(asset.isFavorite);
    assetDict[@"isHidden"] = @(asset.isHidden);
    return assetDict;
  }
  return nil;
}

+ (NSNumber *)_exportDate:(NSDate *)date
{
  if (date) {
    NSTimeInterval interval = date.timeIntervalSince1970;
    NSUInteger intervalMs = interval * 1000;
    return [NSNumber numberWithUnsignedInteger:intervalMs];
  }
  return (id)[NSNull null];
}

+ (nullable NSDictionary *)_exportCollection:(PHAssetCollection *)collection
{
  return [EXMediaLibrary _exportCollection:collection inFolder:nil];
}

+ (nullable NSDictionary *)_exportCollection:(PHAssetCollection *)collection inFolder:(nullable NSString *)folderName
{
  if (collection) {
    return @{
             @"id": [EXMediaLibrary _assetIdFromLocalId:collection.localIdentifier],
             @"title": EXNullIfNil(collection.localizedTitle),
             @"folderName": EXNullIfNil(folderName),
             @"type": [EXMediaLibrary _stringifyAlbumType:collection.assetCollectionType],
             @"assetCount": [EXMediaLibrary _assetCountOfCollection:collection],
             @"startTime": [EXMediaLibrary _exportDate:collection.startDate],
             @"endTime": [EXMediaLibrary _exportDate:collection.endDate],
             @"approximateLocation": [EXMediaLibrary _exportLocation:collection.approximateLocation],
             @"locationNames": EXNullIfNil(collection.localizedLocationNames),
             };
  }
  return nil;
}

+ (NSArray *)_exportCollections:(PHFetchResult *)collections
               withFetchOptions:(PHFetchOptions *)options
                       inFolder:(nullable NSString *)folderName
{
  NSMutableArray<NSDictionary *> *albums = [NSMutableArray new];
  for (PHCollection *collection in collections) {
    if ([collection isKindOfClass:[PHAssetCollection class]]) {
      [albums addObject:[EXMediaLibrary _exportCollection:(PHAssetCollection *)collection inFolder:folderName]];
    }  else if ([collection isKindOfClass:[PHCollectionList class]]) {
      // getting albums from folders
      PHFetchResult *collectionsInFolder = [PHCollectionList fetchCollectionsInCollectionList:(PHCollectionList *)collection options:options];
      [albums addObjectsFromArray:[EXMediaLibrary _exportCollections:collectionsInFolder withFetchOptions:options inFolder:collection.localizedTitle]];
    }
  }
  return [albums copy];
}

+ (nullable NSDictionary *)_exportLocation:(CLLocation *)location
{
  if (location) {
    return @{
             @"latitude": @(location.coordinate.latitude),
             @"longitude": @(location.coordinate.longitude),
             };
  }
  return (id)[NSNull null];
}

+ (NSString *)_assetIdFromLocalId:(nonnull NSString *)localId
{
  // PHAsset's localIdentifier looks like `8B51C35E-E1F3-4D18-BF90-22CC905737E9/L0/001`
  // however `/L0/001` doesn't take part in URL to the asset, so we need to strip it out.
  return [localId stringByReplacingOccurrencesOfString:@"/.*" withString:@"" options:NSRegularExpressionSearch range:NSMakeRange(0, localId.length)];
}

+ (NSString *)_assetUriForLocalId:(nonnull NSString *)localId
{
  NSString *assetId = [EXMediaLibrary _assetIdFromLocalId:localId];
  return [NSString stringWithFormat:@"ph://%@", assetId];
}

// A fix for promise rejection on M1 simulator when run in Rosetta (as is by default as we don't compile ARM64 yet)
// https://developer.apple.com/forums/thread/702933
+ (PHAssetMediaType)assetTypeForFileExtension:(nonnull NSString *)fileExtension
{
  // List from https://stackoverflow.com/a/70102692
  NSDictionary *kExtensionLookupFallback = @{@"jpeg": @(PHAssetMediaTypeImage),
                                             @"jpg": @(PHAssetMediaTypeImage),
                                             @"jpe": @(PHAssetMediaTypeImage),
                                             @"png": @(PHAssetMediaTypeImage),
                                             @"mp3": @(PHAssetMediaTypeAudio),
                                             @"mpga": @(PHAssetMediaTypeAudio),
                                             @"mov": @(PHAssetMediaTypeVideo),
                                             @"qt": @(PHAssetMediaTypeVideo),
                                             @"mpg": @(PHAssetMediaTypeVideo),
                                             @"mpeg": @(PHAssetMediaTypeVideo),
                                             @"mpe": @(PHAssetMediaTypeVideo),
                                             @"m75": @(PHAssetMediaTypeVideo),
                                             @"m15": @(PHAssetMediaTypeVideo),
                                             @"m2v": @(PHAssetMediaTypeVideo),
                                             @"ts": @(PHAssetMediaTypeVideo),
                                             @"mp4": @(PHAssetMediaTypeVideo),
                                             @"mpg4": @(PHAssetMediaTypeVideo),
                                             @"m4p": @(PHAssetMediaTypeVideo),
                                             @"avi": @(PHAssetMediaTypeVideo),
                                             @"vfw": @(PHAssetMediaTypeVideo),
                                             @"aiff": @(PHAssetMediaTypeAudio),
                                             @"aif": @(PHAssetMediaTypeAudio),
                                             @"wav": @(PHAssetMediaTypeAudio),
                                             @"wave": @(PHAssetMediaTypeAudio),
                                             @"bwf": @(PHAssetMediaTypeAudio),
                                             @"midi": @(PHAssetMediaTypeAudio),
                                             @"mid": @(PHAssetMediaTypeAudio),
                                             @"smf": @(PHAssetMediaTypeAudio),
                                             @"kar": @(PHAssetMediaTypeAudio),
                                             @"tiff": @(PHAssetMediaTypeImage),
                                             @"tif": @(PHAssetMediaTypeImage),
                                             @"gif": @(PHAssetMediaTypeImage),
                                             @"qtif": @(PHAssetMediaTypeImage),
                                             @"qti": @(PHAssetMediaTypeImage),
                                             @"icns": @(PHAssetMediaTypeImage)};

  EXLogWarn(@"Asset media type is recognized from file extension and this behavior can differ on iOS Simulator and a physical device.");
  NSNumber *fallbackMediaType = [kExtensionLookupFallback objectForKey:fileExtension];
  return fallbackMediaType ? [fallbackMediaType intValue] : PHAssetMediaTypeUnknown;
}

+ (PHAssetMediaType)_assetTypeForUri:(nonnull NSString *)localUri
{
  CFStringRef fileExtension = (__bridge CFStringRef)[localUri pathExtension];
  CFStringRef fileUTI;
  if (@available(iOS 14, *)) {
    fileUTI = (__bridge CFStringRef)[[UTType typeWithFilenameExtension:(__bridge NSString*)fileExtension] identifier];
  } else {
    fileUTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension, NULL);
  }

  if (fileUTI == nil){
    return [EXMediaLibrary assetTypeForFileExtension:[localUri pathExtension]];
  }

  if (UTTypeConformsTo(fileUTI, kUTTypeImage)) {
    return PHAssetMediaTypeImage;
  }
  if (UTTypeConformsTo(fileUTI, kUTTypeMovie)) {
    return PHAssetMediaTypeVideo;
  }
  if (UTTypeConformsTo(fileUTI, kUTTypeAudio)) {
    return PHAssetMediaTypeAudio;
  }
  return PHAssetMediaTypeUnknown;
}

+ (NSString *)_stringifyMediaType:(PHAssetMediaType)mediaType
{
  switch (mediaType) {
    case PHAssetMediaTypeAudio:
      return EXAssetMediaTypeAudio;
    case PHAssetMediaTypeImage:
      return EXAssetMediaTypePhoto;
    case PHAssetMediaTypeVideo:
      return EXAssetMediaTypeVideo;
    default:
      return EXAssetMediaTypeUnknown;
  }
}

+ (PHAssetMediaType)_convertMediaType:(NSString *)mediaType
{
  if ([mediaType isEqualToString:EXAssetMediaTypeAudio]) {
    return PHAssetMediaTypeAudio;
  }
  if ([mediaType isEqualToString:EXAssetMediaTypePhoto]) {
    return PHAssetMediaTypeImage;
  }
  if ([mediaType isEqualToString:EXAssetMediaTypeVideo]) {
    return PHAssetMediaTypeVideo;
  }
  return PHAssetMediaTypeUnknown;
}

+ (NSMutableArray<NSNumber *> *)_convertMediaTypes:(NSArray<NSString *> *)mediaTypes
{
  __block NSMutableArray<NSNumber *> *assetTypes = [NSMutableArray new];
  
  [mediaTypes enumerateObjectsUsingBlock:^(NSString * _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
    if ([obj isEqualToString:EXAssetMediaTypeAll]) {
      *stop = YES;
      assetTypes = nil;
      return;
    }
    PHAssetMediaType assetType = [EXMediaLibrary _convertMediaType:obj];
    [assetTypes addObject:@(assetType)];
  }];
  
  return assetTypes;
}

+ (NSString *)_convertSortByKey:(NSString *)key
{
  if ([key isEqualToString:@"default"]) {
    return nil;
  }
  
  NSDictionary *conversionDict = @{
                                   @"creationTime": @"creationDate",
                                   @"modificationTime": @"modificationDate",
                                   @"mediaType": @"mediaType",
                                   @"width": @"pixelWidth",
                                   @"height": @"pixelHeight",
                                   @"duration": @"duration",
                                   };
  NSString *value = [conversionDict valueForKey:key];
  
  if (value == nil) {
    NSString *reason = [NSString stringWithFormat:@"SortBy key \"%@\" is not supported!", key];
    @throw [NSException exceptionWithName:@"EXMediaLibrary.UNSUPPORTED_SORTBY_KEY" reason:reason userInfo:nil];
  }
  return value;
}

+ (NSArray<NSString *> *)_stringifyMediaSubtypes:(PHAssetMediaSubtype)mediaSubtypes
{
  NSMutableArray *subtypes = [NSMutableArray new];
  NSMutableDictionary<NSString *, NSNumber *> *subtypesDict = [@{
                                                               @"hdr": @(PHAssetMediaSubtypePhotoHDR),
                                                               @"panorama": @(PHAssetMediaSubtypePhotoPanorama),
                                                               @"stream": @(PHAssetMediaSubtypeVideoStreamed),
                                                               @"timelapse": @(PHAssetMediaSubtypeVideoTimelapse),
                                                               @"screenshot": @(PHAssetMediaSubtypePhotoScreenshot),
                                                               @"highFrameRate": @(PHAssetMediaSubtypeVideoHighFrameRate)
                                                               } mutableCopy];

  subtypesDict[@"livePhoto"] = @(PHAssetMediaSubtypePhotoLive);
  subtypesDict[@"depthEffect"] = @(PHAssetMediaSubtypePhotoDepthEffect);

  for (NSString *subtype in subtypesDict) {
    if (mediaSubtypes & [subtypesDict[subtype] unsignedIntegerValue]) {
      [subtypes addObject:subtype];
    }
  }
  return subtypes;
}

+ (NSString *)_stringifyAlbumType:(PHAssetCollectionType)assetCollectionType
{
  switch (assetCollectionType) {
    case PHAssetCollectionTypeAlbum:
      return @"album";
    case PHAssetCollectionTypeMoment:
      return @"moment";
    case PHAssetCollectionTypeSmartAlbum:
      return @"smartAlbum";
  }
}

+ (NSNumber *)_assetCountOfCollection:(PHAssetCollection *)collection
{
  if (collection.estimatedAssetCount == NSNotFound) {
    PHFetchOptions *options = [PHFetchOptions new];
    options.includeHiddenAssets = NO;
    options.includeAllBurstAssets = NO;
    
    return @([PHAsset fetchAssetsInAssetCollection:collection options:options].count);
  }
  return @(collection.estimatedAssetCount);
}

+ (NSSortDescriptor *)_sortDescriptorFrom:(id)config
{
  NSArray *parts = [config componentsSeparatedByString:@" "];
  NSString *key = [EXMediaLibrary _convertSortByKey:parts[0]];

  BOOL ascending = NO;
  if ([parts count] > 1) {
    if ([parts[1] isEqualToString: @"ASC"]) {
      ascending = YES;
    }
  }

  if (key) {
    return [NSSortDescriptor sortDescriptorWithKey:key ascending:ascending];
  }
  return nil;
}

+ (NSArray *)_prepareSortDescriptors:(NSArray *)sortBy
{
  NSMutableArray *sortDescriptors = [NSMutableArray new];
  NSArray *sortByArray = (NSArray *)sortBy;
  
  for (id config in sortByArray) {
    NSSortDescriptor *sortDescriptor = [EXMediaLibrary _sortDescriptorFrom:config];
    
    if (sortDescriptor) {
      [sortDescriptors addObject:sortDescriptor];
    }
  }
  return sortDescriptors;
}

+ (NSURL *)_normalizeAssetURLFromUri:(NSString *)uri
{
  if ([uri hasPrefix:@"/"]) {
    return [NSURL URLWithString:[@"file://" stringByAppendingString:uri]];
  }
  return [NSURL URLWithString:uri];
}

- (void)_runIfAllPermissionsWereGranted:(EXPromiseRejectBlock)reject block:(void (^)(void))block
{
  [_permissionsManager getPermissionUsingRequesterClass:[EXMediaLibraryMediaLibraryPermissionRequester class] resolve:^(id result) {
    NSDictionary *permissions = (NSDictionary *)result;
    
    if (![permissions[@"status"] isEqualToString:@"granted"]) {
      reject(@"E_NO_PERMISSIONS", @"MEDIA_LIBRARY permission is required to do this operation.", nil);
      return;
    }
    
#ifdef __IPHONE_14_0
    if (![permissions[@"accessPrivileges"] isEqualToString:@"all"]) {
      reject(@"ERR_NO_ENOUGH_PERMISSIONS", @"Access to all photos is required to do this operation.", nil);
      return;
    }
#endif
    
    block();
  } reject:reject];
}

- (BOOL)_checkPermissions:(EXPromiseRejectBlock)reject
{
  if (![_permissionsManager hasGrantedPermissionUsingRequesterClass:[EXMediaLibraryMediaLibraryPermissionRequester class]]) {
    reject(@"E_NO_PERMISSIONS", @"MEDIA_LIBRARY permission is required to do this operation.", nil);
    return NO;
  }
  return YES;
}

@end
