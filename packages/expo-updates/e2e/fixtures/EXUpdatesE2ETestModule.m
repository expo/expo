// Copyright 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesE2ETestModule.h>

#if __has_include(<EXUpdates/EXUpdates-Swift.h>)
#import <EXUpdates/EXUpdates-Swift.h>
#else
#import "EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesE2ETestModule

EX_EXPORT_MODULE(ExpoUpdatesE2ETest);

EX_EXPORT_METHOD_AS(readInternalAssetsFolderAsync,
                    readInternalAssetsFolderAsync:(EXPromiseResolveBlock)resolve
                                           reject:(EXPromiseRejectBlock)reject)
{
  NSURL *assetsFolder = EXUpdatesAppController.sharedInstance.updatesDirectory;
  dispatch_async(EXUpdatesFileDownloader.assetFilesQueue, ^{
    NSError *error;
    NSArray<NSString *> *contents = [NSFileManager.defaultManager contentsOfDirectoryAtPath:assetsFolder.path error:&error];
    int count = 0;
    for (NSString *file in contents) {
      if ([file hasPrefix:@"expo-"] && ([file hasSuffix:@".db"] || [file containsString:@".db-"])) {
        continue;
      }
      count++;
    }
    if (error) {
      reject(@"ERR_UPDATES_E2E_READ", error.localizedDescription, error);
      return;
    }
    resolve(@(count));
  });
}

EX_EXPORT_METHOD_AS(clearInternalAssetsFolderAsync,
                    clearInternalAssetsFolderAsync:(EXPromiseResolveBlock)resolve
                                            reject:(EXPromiseRejectBlock)reject)
{
  NSURL *assetsFolder = EXUpdatesAppController.sharedInstance.updatesDirectory;
  dispatch_async(EXUpdatesFileDownloader.assetFilesQueue, ^{
    NSError *error;
    NSArray<NSString *> *contents = [NSFileManager.defaultManager contentsOfDirectoryAtPath:assetsFolder.path error:&error];
    if (error) {
      reject(@"ERR_UPDATES_E2E_CLEAR", error.localizedDescription, error);
      return;
    }
    for (NSString *file in contents) {
      if ([file hasPrefix:@"expo-"] && ([file hasSuffix:@".db"] || [file containsString:@".db-"])) {
        continue;
      }
      NSString *filePath = [assetsFolder URLByAppendingPathComponent:file].path;
      NSError *deleteError;
      BOOL success = [NSFileManager.defaultManager removeItemAtPath:filePath error:&deleteError];
      if (!success) {
        reject(@"ERR_UPDATES_E2E_CLEAR", deleteError.localizedDescription, deleteError);
        return;
      }
    }
    resolve(nil);
  });
}

@end

NS_ASSUME_NONNULL_END
