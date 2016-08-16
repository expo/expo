/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTCameraRollManager.h"

#import <CoreLocation/CoreLocation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "ABI7_0_0RCTAssetsLibraryRequestHandler.h"
#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTImageLoader.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTUtils.h"

@implementation ABI7_0_0RCTConvert (ALAssetGroup)

ABI7_0_0RCT_ENUM_CONVERTER(ALAssetsGroupType, (@{

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
    ABI7_0_0RCTLogError(@"Invalid filter option: '%@'. Expected one of 'photos',"
                "'videos' or 'all'.", json);
  }
  return filter ?: [ALAssetsFilter allPhotos];
}

@end

@implementation ABI7_0_0RCTCameraRollManager

ABI7_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

NSString *const ABI7_0_0RCTErrorUnableToLoad = @"E_UNABLE_TO_LOAD";
NSString *const ABI7_0_0RCTErrorUnableToSave = @"E_UNABLE_TO_SAVE";

ABI7_0_0RCT_EXPORT_METHOD(saveImageWithTag:(NSString *)imageTag
                  resolve:(ABI7_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI7_0_0RCTPromiseRejectBlock)reject)
{
  [_bridge.imageLoader loadImageWithTag:imageTag callback:^(NSError *loadError, UIImage *loadedImage) {
    if (loadError) {
      reject(ABI7_0_0RCTErrorUnableToLoad, nil, loadError);
      return;
    }
    // It's unclear if writeImageToSavedPhotosAlbum is thread-safe
    dispatch_async(dispatch_get_main_queue(), ^{
      [_bridge.assetsLibrary writeImageToSavedPhotosAlbum:loadedImage.CGImage metadata:nil completionBlock:^(NSURL *assetURL, NSError *saveError) {
        if (saveError) {
          ABI7_0_0RCTLogWarn(@"Error saving cropped image: %@", saveError);
          reject(ABI7_0_0RCTErrorUnableToSave, nil, saveError);
        } else {
          resolve(assetURL.absoluteString);
        }
      }];
    });
  }];
}

static void ABI7_0_0RCTResolvePromise(ABI7_0_0RCTPromiseResolveBlock resolve,
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

ABI7_0_0RCT_EXPORT_METHOD(getPhotos:(NSDictionary *)params
                  resolve:(ABI7_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI7_0_0RCTPromiseRejectBlock)reject)
{
  NSUInteger first = [ABI7_0_0RCTConvert NSInteger:params[@"first"]];
  NSString *afterCursor = [ABI7_0_0RCTConvert NSString:params[@"after"]];
  NSString *groupName = [ABI7_0_0RCTConvert NSString:params[@"groupName"]];
  ALAssetsFilter *assetType = [ABI7_0_0RCTConvert ALAssetsFilter:params[@"assetType"]];
  ALAssetsGroupType groupTypes = [ABI7_0_0RCTConvert ALAssetsGroupType:params[@"groupTypes"]];

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
            ABI7_0_0RCTAssert(resolvedPromise == NO, @"Resolved the promise before we finished processing the results.");
            ABI7_0_0RCTResolvePromise(resolve, assets, hasNextPage);
            resolvedPromise = YES;
            return;
          }
          CGSize dimensions = [result defaultRepresentation].dimensions;
          CLLocation *loc = [result valueForProperty:ALAssetPropertyLocation];
          NSDate *date = [result valueForProperty:ALAssetPropertyDate];
          [assets addObject:@{
            @"node": @{
              @"type": [result valueForProperty:ALAssetPropertyType],
              @"group_name": [group valueForProperty:ALAssetsGroupPropertyName],
              @"image": @{
                @"uri": uri,
                @"height": @(dimensions.height),
                @"width": @(dimensions.width),
                @"isStored": @YES,
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
    } else {
      // Sometimes the enumeration continues even if we set stop above, so we guard against resolving the promise
      // multiple times here.
      if (!resolvedPromise) {
        ABI7_0_0RCTResolvePromise(resolve, assets, hasNextPage);
        resolvedPromise = YES;
      }
    }
  } failureBlock:^(NSError *error) {
    if (error.code != ALAssetsLibraryAccessUserDeniedError) {
      ABI7_0_0RCTLogError(@"Failure while iterating through asset groups %@", error);
    }
    reject(ABI7_0_0RCTErrorUnableToLoad, nil, error);
  }];
}

@end
