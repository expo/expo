// Copyright 2015-present 650 Industries. All rights reserved.

#import <Photos/Photos.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import <EXMediaLibrary/EXMediaLibrary.h>

#import <UMCore/UMDefines.h>
#import <UMCore/UMEventEmitterService.h>
#import <UMFileSystemInterface/UMFileSystemInterface.h>
#import <UMPermissionsInterface/UMPermissionsInterface.h>

NSString *const EXAssetMediaTypeAudio = @"audio";
NSString *const EXAssetMediaTypePhoto = @"photo";
NSString *const EXAssetMediaTypeVideo = @"video";
NSString *const EXAssetMediaTypeUnknown = @"unknown";
NSString *const EXAssetMediaTypeAll = @"all";

NSString *const EXMediaLibraryDidChangeEvent = @"mediaLibraryDidChange";

@interface EXMediaLibrary ()

@property (nonatomic, strong) PHFetchResult *allAssetsFetchResult;
@property (nonatomic, weak) id<UMPermissionsInterface> permissionsManager;
@property (nonatomic, weak) id<UMFileSystemInterface> fileSystem;
@property (nonatomic, weak) id<UMEventEmitterService> eventEmitter;

@end

@implementation EXMediaLibrary

UM_EXPORT_MODULE(ExponentMediaLibrary);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _fileSystem = [moduleRegistry getModuleImplementingProtocol:@protocol(UMFileSystemInterface)];
  _eventEmitter = [moduleRegistry getModuleImplementingProtocol:@protocol(UMEventEmitterService)];
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMPermissionsInterface)];
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

UM_EXPORT_METHOD_AS(createAssetAsync,
                    createAssetFromLocalUri:(nonnull NSString *)localUri
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
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
  if (!([_fileSystem permissionsForURI:assetUrl] & UMFileSystemPermissionRead)) {
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

UM_EXPORT_METHOD_AS(addAssetsToAlbumAsync,
                    addAssets:(NSArray<NSString *> *)assetIds
                    toAlbum:(nonnull NSString *)albumId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  [EXMediaLibrary _addAssets:assetIds toAlbum:albumId withCallback:^(BOOL success, NSError *error) {
    if (error) {
      reject(@"E_ADD_TO_ALBUM_FAILED", @"Couldn\'t add assets to album", error);
    } else {
      resolve(@(success));
    }
  }];
}

UM_EXPORT_METHOD_AS(removeAssetsFromAlbumAsync,
                    removeAssets:(NSArray<NSString *> *)assetIds
                    fromAlbum:(nonnull NSString *)albumId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
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
}

UM_EXPORT_METHOD_AS(deleteAssetsAsync,
                    deleteAssets:(NSArray<NSString *>*)assetIds
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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

UM_EXPORT_METHOD_AS(getAlbumsAsync,
                    getAlbumsWithOptions:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }

  NSMutableArray<NSDictionary *> *albums = [NSMutableArray new];
  
  PHFetchOptions *fetchOptions = [PHFetchOptions new];
  fetchOptions.includeHiddenAssets = NO;
  fetchOptions.includeAllBurstAssets = NO;
  
  PHFetchResult *userAlbumsFetchResult = [PHCollectionList fetchTopLevelUserCollectionsWithOptions:fetchOptions];
  [albums addObjectsFromArray:[EXMediaLibrary _exportCollections:userAlbumsFetchResult]];

  if ([options[@"includeSmartAlbums"] boolValue]) {
    PHFetchResult<PHAssetCollection *> *smartAlbumsFetchResult =
    [PHAssetCollection fetchAssetCollectionsWithType:PHAssetCollectionTypeSmartAlbum
                                             subtype:PHAssetCollectionSubtypeAlbumRegular
                                             options:fetchOptions];
    [albums addObjectsFromArray:[EXMediaLibrary _exportCollections:smartAlbumsFetchResult]];
  }
  
  resolve(albums);
}

UM_EXPORT_METHOD_AS(getMomentsAsync,
                    getMoments:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  PHFetchOptions *options = [PHFetchOptions new];
  options.includeHiddenAssets = NO;
  options.includeAllBurstAssets = NO;
  
  PHFetchResult *fetchResult = [PHAssetCollection fetchMomentsWithOptions:options];
  NSArray<NSDictionary *> *albums = [EXMediaLibrary _exportCollections:fetchResult];
  
  resolve(albums);
}

UM_EXPORT_METHOD_AS(getAlbumAsync,
                    getAlbumWithTitle:(nonnull NSString *)title
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  PHAssetCollection *collection = [EXMediaLibrary _getAlbumWithTitle:title];
  resolve(UMNullIfNil([EXMediaLibrary _exportCollection:collection]));
}

UM_EXPORT_METHOD_AS(createAlbumAsync,
                    createAlbumWithTitle:(nonnull NSString *)title
                    withAssetId:(NSString *)assetId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  [EXMediaLibrary _createAlbumWithTitle:title completion:^(PHAssetCollection *collection, NSError *error) {
    if (collection) {
      if (assetId) {
        [EXMediaLibrary _addAssets:@[assetId] toAlbum:collection.localIdentifier withCallback:^(BOOL success, NSError *error) {
          if (success) {
            resolve(UMNullIfNil([EXMediaLibrary _exportCollection:collection]));
          } else {
            reject(@"E_ALBUM_CANT_ADD_ASSET", @"Unable to add asset to the new album", error);
          }
        }];
      } else {
        resolve(UMNullIfNil([EXMediaLibrary _exportCollection:collection]));
      }
    } else {
      reject(@"E_ALBUM_CREATE_FAILED", @"Could not create album", error);
    }
  }];
}

  
UM_EXPORT_METHOD_AS(deleteAlbumsAsync,
                    deleteAlbums:(nonnull NSArray<NSString *>*)albumIds
                    assetRemove:(NSNumber *)assetRemove
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{

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
}
  
UM_EXPORT_METHOD_AS(getAssetInfoAsync,
                    getAssetInfo:(nonnull NSString *)assetId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  PHAsset *asset = [EXMediaLibrary _getAssetById:assetId];
  
  if (asset) {
    NSMutableDictionary *result = [EXMediaLibrary _exportAssetInfo:asset];
    PHContentEditingInputRequestOptions *options = [PHContentEditingInputRequestOptions new];
    options.networkAccessAllowed = YES;
    
    [asset requestContentEditingInputWithOptions:options completionHandler:^(PHContentEditingInput * _Nullable contentEditingInput, NSDictionary * _Nonnull info) {
      result[@"localUri"] = [contentEditingInput.fullSizeImageURL absoluteString];
      result[@"orientation"] = @(contentEditingInput.fullSizeImageOrientation);
      
      if (asset.mediaType == PHAssetMediaTypeImage) {
        CIImage *ciImage = [CIImage imageWithContentsOfURL:contentEditingInput.fullSizeImageURL];
        result[@"exif"] = ciImage.properties;
      }
      resolve(result);
    }];
  } else {
    resolve([NSNull null]);
  }
}

UM_EXPORT_METHOD_AS(getAssetsAsync,
                    getAssetsWithOptions:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![self _checkPermissions:reject]) {
    return;
  }
  
  PHFetchOptions *fetchOptions = [PHFetchOptions new];
  NSMutableArray<NSPredicate *> *predicates = [NSMutableArray new];
  NSMutableDictionary *response = [NSMutableDictionary new];
  NSMutableArray<NSDictionary *> *assets = [NSMutableArray new];
  
  // options
  NSString *after = options[@"after"];
  NSInteger first = [options[@"first"] integerValue] ?: 20;
  NSArray<NSString *> *mediaType = options[@"mediaType"];
  NSArray *sortBy = options[@"sortBy"];
  NSString *albumId = options[@"album"];
  
  PHAssetCollection *collection;
  PHAsset *cursor;
  
  if (after) {
    cursor = [EXMediaLibrary _getAssetById:after];
    
    if (!cursor) {
      reject(@"E_CURSOR_NOT_FOUND", @"Couldn't find cursor", nil);
      return;
    }
  }
  
  if (albumId) {
    collection = [EXMediaLibrary _getAlbumById:albumId];
    
    if (!collection) {
      reject(@"E_ALBUM_NOT_FOUND", @"Couldn't find album", nil);
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
      // Ultimately, we emit an event only when something has been inserted or removed from the library.
      if (changeDetails.hasIncrementalChanges && (changeDetails.insertedObjects.count > 0 || changeDetails.removedObjects.count > 0)) {
        NSMutableArray *insertedAssets = [NSMutableArray new];
        NSMutableArray *deletedAssets = [NSMutableArray new];
        NSDictionary *body = @{
                               @"insertedAssets": insertedAssets,
                               @"deletedAssets": deletedAssets,
                               };
        
        for (PHAsset *asset in changeDetails.insertedObjects) {
          [insertedAssets addObject:[EXMediaLibrary _exportAsset:asset]];
        }
        for (PHAsset *asset in changeDetails.removedObjects) {
          [deletedAssets addObject:[EXMediaLibrary _exportAsset:asset]];
        }
        
        [_eventEmitter sendEventWithName:EXMediaLibraryDidChangeEvent body:body];
      }
    }
  }
}


# pragma mark - Internal methods


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
                                subtype:PHAssetCollectionSubtypeAlbumRegular
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
    NSString *assetExtension = [fileName pathExtension];
    
    return @{
             @"id": asset.localIdentifier,
             @"filename": fileName,
             @"uri": [EXMediaLibrary _assetUriForLocalId:asset.localIdentifier andExtension:assetExtension],
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
  if (collection) {
    return @{
             @"id": [EXMediaLibrary _assetIdFromLocalId:collection.localIdentifier],
             @"title": collection.localizedTitle ?: [NSNull null],
             @"type": [EXMediaLibrary _stringifyAlbumType:collection.assetCollectionType],
             @"assetCount": [EXMediaLibrary _assetCountOfCollection:collection],
             @"startTime": [EXMediaLibrary _exportDate:collection.startDate],
             @"endTime": [EXMediaLibrary _exportDate:collection.endDate],
             @"approximateLocation": [EXMediaLibrary _exportLocation:collection.approximateLocation],
             @"locationNames": collection.localizedLocationNames,
             };
  }
  return nil;
}

+ (NSArray *)_exportCollections:(PHFetchResult *)collections
{
  NSMutableArray<NSDictionary *> *albums = [NSMutableArray new];
  
  for (PHAssetCollection *collection in collections) {
    [albums addObject:[EXMediaLibrary _exportCollection:collection]];
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

+ (NSString *)_assetUriForLocalId:(nonnull NSString *)localId andExtension:(nonnull NSString *)extension
{
  NSString *assetId = [EXMediaLibrary _assetIdFromLocalId:localId];
  NSString *uppercasedExtension = [extension uppercaseString];
  
  return [NSString stringWithFormat:@"assets-library://asset/asset.%@?id=%@&ext=%@", uppercasedExtension, assetId, uppercasedExtension];
}

+ (PHAssetMediaType)_assetTypeForUri:(nonnull NSString *)localUri
{
  CFStringRef fileExtension = (__bridge CFStringRef)[localUri pathExtension];
  CFStringRef fileUTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, fileExtension, NULL);
  
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
  if (@available(iOS 10.2, *)) {
    subtypesDict[@"depthEffect"] = @(PHAssetMediaSubtypePhotoDepthEffect);
  }
  
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
  if ([config isKindOfClass:[NSString class]]) {
    NSString *key = [EXMediaLibrary _convertSortByKey:config];
    
    if (key) {
      return [NSSortDescriptor sortDescriptorWithKey:key ascending:NO];
    }
  }
  if ([config isKindOfClass:[NSArray class]]) {
    NSArray *sortArray = (NSArray *)config;
    NSString *key = [EXMediaLibrary _convertSortByKey:sortArray[0]];
    BOOL ascending = sortArray[1] > 0;
    
    if (key) {
      return [NSSortDescriptor sortDescriptorWithKey:key ascending:ascending];
    }
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

- (BOOL)_checkPermissions:(UMPromiseRejectBlock)reject
{
  NSDictionary *cameraRollPermissions = [_permissionsManager getPermissionsForResource:@"cameraRoll"];
  if (![cameraRollPermissions[@"status"] isEqualToString:@"granted"]) {
    reject(@"E_NO_PERMISSIONS", @"CAMERA_ROLL permission is required to do this operation.", nil);
    return NO;
  }
  return YES;
}

@end
