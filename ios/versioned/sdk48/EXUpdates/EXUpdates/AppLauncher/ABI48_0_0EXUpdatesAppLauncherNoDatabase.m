//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAsset.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppLauncherNoDatabase.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI48_0_0EXUpdatesErrorLogFile = @"expo-error.log";

@interface ABI48_0_0EXUpdatesAppLauncherNoDatabase ()

@property (nullable, nonatomic, strong, readwrite) ABI48_0_0EXUpdatesUpdate *launchedUpdate;
@property (nullable, nonatomic, strong, readwrite) NSURL *launchAssetUrl;
@property (nullable, nonatomic, strong, readwrite) NSMutableDictionary *assetFilesMap;

@end

/**
 * Implementation of ABI48_0_0EXUpdatesAppLauncher which always uses the update embedded in the application
 * package, avoiding SQLite and the expo-updates file store entirely.
 *
 * This is only used in rare cases when the database/file system is corrupt or otherwise
 * inaccessible, but we still want to avoid crashing. The exported property `isEmergencyLaunch` on
 * ABI48_0_0EXUpdatesModule should be `true` whenever this class is used.
 */
@implementation ABI48_0_0EXUpdatesAppLauncherNoDatabase

- (void)launchUpdateWithConfig:(ABI48_0_0EXUpdatesConfig *)config
{
  _launchedUpdate = [ABI48_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:config database:nil];
  if (_launchedUpdate) {
    if (_launchedUpdate.status == ABI48_0_0EXUpdatesUpdateStatusEmbedded) {
      NSAssert(_assetFilesMap == nil, @"assetFilesMap should be null for embedded updates");
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:ABI48_0_0EXUpdatesBareEmbeddedBundleFilename withExtension:ABI48_0_0EXUpdatesBareEmbeddedBundleFileType];
    } else {
      _launchAssetUrl = [[NSBundle mainBundle] URLForResource:ABI48_0_0EXUpdatesEmbeddedBundleFilename withExtension:ABI48_0_0EXUpdatesEmbeddedBundleFileType];

      NSMutableDictionary *assetFilesMap = [NSMutableDictionary new];
      for (ABI48_0_0EXUpdatesAsset *asset in _launchedUpdate.assets) {
        NSURL *localUrl = [ABI48_0_0EXUpdatesUtils urlForBundledAsset:asset];
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
