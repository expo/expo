//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAsset.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesAppLauncherNoDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI43_0_0EXUpdatesErrorLogFile = @"expo-error.log";

@interface ABI43_0_0EXUpdatesAppLauncherNoDatabase ()

@property (nullable, nonatomic, strong, readwrite) ABI43_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readwrite) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readwrite) NSMutableDictionary *assetFilesMap;

@end

@implementation ABI43_0_0EXUpdatesAppLauncherNoDatabase

- (void)launchUpdateWithConfig:(ABI43_0_0EXUpdatesConfig *)config
{
  _launchedUpdate = [ABI43_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:config database:nil];
  if (_launchedUpdate) {
    if (_launchedUpdate.status == ABI43_0_0EXUpdatesUpdateStatusEmbedded) {
      NSAssert(_assetFilesMap == nil, @"assetFilesMap should be null for embedded updates");
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:ABI43_0_0EXUpdatesBareEmbeddedBundleFilename withExtension:ABI43_0_0EXUpdatesBareEmbeddedBundleFileType];
    } else {
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:ABI43_0_0EXUpdatesEmbeddedBundleFilename withExtension:ABI43_0_0EXUpdatesEmbeddedBundleFileType];

      NSMutableDictionary *assetFilesMap = [NSMutableDictionary new];
      for (ABI43_0_0EXUpdatesAsset *asset in _launchedUpdate.assets) {
        NSURL *localUrl = [ABI43_0_0EXUpdatesUtils urlForBundledAsset:asset];
        if (localUrl && asset.key) {
          assetFilesMap[asset.key] = localUrl.absoluteString;
        }
      }
      _assetFilesMap = assetFilesMap;
    }
  }
}

- (BOOL)isUsingEmbeddedAssets
{
  return _assetFilesMap == nil;
}

@end

NS_ASSUME_NONNULL_END
