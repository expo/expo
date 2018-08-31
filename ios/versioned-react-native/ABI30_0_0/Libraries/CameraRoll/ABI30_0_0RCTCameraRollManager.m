/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTCameraRollManager.h"

#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <Photos/Photos.h>

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTImageLoader.h>
#import <ReactABI30_0_0/ABI30_0_0RCTLog.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUtils.h>

#import "ABI30_0_0RCTAssetsLibraryRequestHandler.h"

@implementation ABI30_0_0RCTConvert (ALAssetGroup)

ABI30_0_0RCT_ENUM_CONVERTER(ALAssetsGroupType, (@{

  // New values
  @"album": @(ALAssetsGroupAlbum),
  @"all": @(ALAssetsGroupAll),
  @"event": @(ALAssetsGroupEvent),
  @"faces": @(ALAssetsGroupFaces),
  @"library": @(ALAssetsGroupLibrary),
  @"photo-stream": @(ALAssetsGroupPhotoStream),
  @"saved-photos": @(ALAssetsGroupSavedPhotos),

  // Legacy values
  @"Album": @(ALAssetsGroupAlbum),
  @"All": @(ALAssetsGroupAll),
  @"Event": @(ALAssetsGroupEvent),
  @"Faces": @(ALAssetsGroupFaces),
  @"Library": @(ALAssetsGroupLibrary),
  @"PhotoStream": @(ALAssetsGroupPhotoStream),
  @"SavedPhotos": @(ALAssetsGroupSavedPhotos),

}), ALAssetsGroupSavedPhotos, integerValue)

+ (ALAssetsFilter *)ALAssetsFilter:(id)json
{
  static NSDictionary<NSString *, ALAssetsFilter *> *options;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    options = @{

      // New values
      @"photos": [ALAssetsFilter allPhotos],
      @"videos": [ALAssetsFilter allVideos],
      @"all": [ALAssetsFilter allAssets],

      // Legacy values
      @"Photos": [ALAssetsFilter allPhotos],
      @"Videos": [ALAssetsFilter allVideos],
      @"All": [ALAssetsFilter allAssets],
    };
  });

  ALAssetsFilter *filter = options[json ?: @"photos"];
  if (!filter) {
    ABI30_0_0RCTLogError(@"Invalid filter option: '%@'. Expected one of 'photos',"
                "'videos' or 'all'.", json);
  }
  return filter ?: [ALAssetsFilter allPhotos];
}

@end

@implementation ABI30_0_0RCTCameraRollManager

ABI30_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

static NSString *const kErrorUnableToLoad = @"E_UNABLE_TO_LOAD";
static NSString *const kErrorUnableToSave = @"E_UNABLE_TO_SAVE";

ABI30_0_0RCT_EXPORT_METHOD(saveToCameraRoll:(NSURLRequest *)request
                  type:(NSString *)type
                  resolve:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  if ([type isEqualToString:@"video"]) {
    // It's unclear if writeVideoAtPathToSavedPhotosAlbum is thread-safe
    dispatch_async(dispatch_get_main_queue(), ^{
      [self->_bridge.assetsLibrary writeVideoAtPathToSavedPhotosAlbum:request.URL completionBlock:^(NSURL *assetURL, NSError *saveError) {
        if (saveError) {
          reject(kErrorUnableToSave, nil, saveError);
        } else {
          resolve(assetURL.absoluteString);
        }
      }];
    });
  } else {
    [_bridge.imageLoader loadImageWithURLRequest:request
                                        callback:^(NSError *loadError, UIImage *loadedImage) {
      if (loadError) {
        reject(kErrorUnableToLoad, nil, loadError);
        return;
      }
      // It's unclear if writeImageToSavedPhotosAlbum is thread-safe
      dispatch_async(dispatch_get_main_queue(), ^{
        [self->_bridge.assetsLibrary writeImageToSavedPhotosAlbum:loadedImage.CGImage metadata:nil completionBlock:^(NSURL *assetURL, NSError *saveError) {
          if (saveError) {
            ABI30_0_0RCTLogWarn(@"Error saving cropped image: %@", saveError);
            reject(kErrorUnableToSave, nil, saveError);
          } else {
            resolve(assetURL.absoluteString);
          }
        }];
      });
    }];
  }
}

static void ABI30_0_0RCTResolvePromise(ABI30_0_0RCTPromiseResolveBlock resolve,
                              NSArray<NSDictionary<NSString *, id> *> *assets,
                              BOOL hasNextPage)
{
  if (!assets.count) {
    resolve(@{
      @"edges": assets,
      @"page_info": @{
        @"has_next_page": @NO,
      }
    });
    return;
  }
  resolve(@{
    @"edges": assets,
    @"page_info": @{
      @"start_cursor": assets[0][@"node"][@"image"][@"uri"],
      @"end_cursor": assets[assets.count - 1][@"node"][@"image"][@"uri"],
      @"has_next_page": @(hasNextPage),
    }
  });
}

ABI30_0_0RCT_EXPORT_METHOD(getPhotos:(NSDictionary *)params
                  resolve:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  checkPhotoLibraryConfig();

  NSUInteger first = [ABI30_0_0RCTConvert NSInteger:params[@"first"]];
  NSString *afterCursor = [ABI30_0_0RCTConvert NSString:params[@"after"]];
  NSString *groupName = [ABI30_0_0RCTConvert NSString:params[@"groupName"]];
  ALAssetsFilter *assetType = [ABI30_0_0RCTConvert ALAssetsFilter:params[@"assetType"]];
  ALAssetsGroupType groupTypes = [ABI30_0_0RCTConvert ALAssetsGroupType:params[@"groupTypes"]];

  BOOL __block foundAfter = NO;
  BOOL __block hasNextPage = NO;
  BOOL __block resolvedPromise = NO;
  NSMutableArray<NSDictionary<NSString *, id> *> *assets = [NSMutableArray new];

  [_bridge.assetsLibrary enumerateGroupsWithTypes:groupTypes usingBlock:^(ALAssetsGroup *group, BOOL *stopGroups) {
    if (group && (groupName == nil || [groupName isEqualToString:[group valueForProperty:ALAssetsGroupPropertyName]])) {

      [group setAssetsFilter:assetType];
      [group enumerateAssetsWithOptions:NSEnumerationReverse usingBlock:^(ALAsset *result, NSUInteger index, BOOL *stopAssets) {
        if (result) {
          NSString *uri = ((NSURL *)[result valueForProperty:ALAssetPropertyAssetURL]).absoluteString;
          if (afterCursor && !foundAfter) {
            if ([afterCursor isEqualToString:uri]) {
              foundAfter = YES;
            }
            return; // Skip until we get to the first one
          }
          if (first == assets.count) {
            *stopAssets = YES;
            *stopGroups = YES;
            hasNextPage = YES;
            ABI30_0_0RCTAssert(resolvedPromise == NO, @"Resolved the promise before we finished processing the results.");
            ABI30_0_0RCTResolvePromise(resolve, assets, hasNextPage);
            resolvedPromise = YES;
            return;
          }
          CGSize dimensions = [result defaultRepresentation].dimensions;
          CLLocation *loc = [result valueForProperty:ALAssetPropertyLocation];
          NSDate *date = [result valueForProperty:ALAssetPropertyDate];
          NSString *filename = [result defaultRepresentation].filename;
          int64_t duration = 0;
          if ([[result valueForProperty:ALAssetPropertyType] isEqualToString:ALAssetTypeVideo]) {
            duration = [[result valueForProperty:ALAssetPropertyDuration] intValue];
          }

          [assets addObject:@{
            @"node": @{
              @"type": [result valueForProperty:ALAssetPropertyType],
              @"group_name": [group valueForProperty:ALAssetsGroupPropertyName],
              @"image": @{
                @"uri": uri,
                @"filename" : filename ?: [NSNull null],
                @"height": @(dimensions.height),
                @"width": @(dimensions.width),
                @"isStored": @YES,
                @"playableDuration": @(duration),
              },
              @"timestamp": @(date.timeIntervalSince1970),
              @"location": loc ? @{
                @"latitude": @(loc.coordinate.latitude),
                @"longitude": @(loc.coordinate.longitude),
                @"altitude": @(loc.altitude),
                @"heading": @(loc.course),
                @"speed": @(loc.speed),
              } : @{},
            }
          }];
        }
      }];
    }

    if (!group) {
      // Sometimes the enumeration continues even if we set stop above, so we guard against resolving the promise
      // multiple times here.
      if (!resolvedPromise) {
        ABI30_0_0RCTResolvePromise(resolve, assets, hasNextPage);
        resolvedPromise = YES;
      }
    }
  } failureBlock:^(NSError *error) {
    if (error.code != ALAssetsLibraryAccessUserDeniedError) {
      ABI30_0_0RCTLogError(@"Failure while iterating through asset groups %@", error);
    }
    reject(kErrorUnableToLoad, nil, error);
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(deletePhotos:(NSArray<NSString *>*)assets
                  resolve:(ABI30_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI30_0_0RCTPromiseRejectBlock)reject)
{
  NSArray<NSURL *> *assets_ = [ABI30_0_0RCTConvert NSURLArray:assets];
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
      PHFetchResult<PHAsset *> *fetched =
        [PHAsset fetchAssetsWithALAssetURLs:assets_ options:nil];
      [PHAssetChangeRequest deleteAssets:fetched];
    }
  completionHandler:^(BOOL success, NSError *error) {
      if (success == YES) {
     	    resolve(@(success));
      }
      else {
	        reject(@"Couldn't delete", @"Couldn't delete assets", error);
      }
    }
    ];
}

static void checkPhotoLibraryConfig()
{
#if ABI30_0_0RCT_DEV
  if (![[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSPhotoLibraryUsageDescription"]) {
    ABI30_0_0RCTLogError(@"NSPhotoLibraryUsageDescription key must be present in Info.plist to use camera roll.");
  }
#endif
}

@end
