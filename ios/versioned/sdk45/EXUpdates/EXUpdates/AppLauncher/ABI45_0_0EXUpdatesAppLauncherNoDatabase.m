//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesAsset.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesAppLauncherNoDatabase.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI45_0_0EXUpdatesErrorLogFile = @"expo-error.log";

@interface ABI45_0_0EXUpdatesAppLauncherNoDatabase ()

@property (nullable, nonatomic, strong, readwrite) ABI45_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readwrite) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readwrite) NSMutableDictionary *assetFilesMap;

@end

@implementation ABI45_0_0EXUpdatesAppLauncherNoDatabase

- (void)launchUpdateWithConfig:(ABI45_0_0EXUpdatesConfig *)config
{
  _launchedUpdate = [ABI45_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:config database:nil];
  if (_launchedUpdate) {
    if (_launchedUpdate.status == ABI45_0_0EXUpdatesUpdateStatusEmbedded) {
      NSAssert(_assetFilesMap == nil, @"assetFilesMap should be null for embedded updates");
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:ABI45_0_0EXUpdatesBareEmbeddedBundleFilename withExtension:ABI45_0_0EXUpdatesBareEmbeddedBundleFileType];
    } else {
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:ABI45_0_0EXUpdatesEmbeddedBundleFilename withExtension:ABI45_0_0EXUpdatesEmbeddedBundleFileType];

      NSMutableDictionary *assetFilesMap = [NSMutableDictionary new];
      for (ABI45_0_0EXUpdatesAsset *asset in _launchedUpdate.assets) {
        NSURL *localUrl = [ABI45_0_0EXUpdatesUtils urlForBundledAsset:asset];
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
