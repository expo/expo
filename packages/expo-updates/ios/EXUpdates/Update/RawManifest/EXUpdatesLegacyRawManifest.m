//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesLegacyRawManifest.h>

@implementation EXUpdatesLegacyRawManifest

# pragma mark - Field Methods

- (NSString *)releaseID {
  return self.rawManifestJSON[@"releaseId"];
}

- (NSString *)commitTime {
  return self.rawManifestJSON[@"commitTime"];
}

- (nullable NSArray *)bundledAssets {
  return self.rawManifestJSON[@"bundledAssets"];
}

- (nullable id)runtimeVersion {
  return self.rawManifestJSON[@"runtimeVersion"];
}

- (nullable NSString *)bundleKey {
  return self.rawManifestJSON[@"bundleKey"];
}

- (nullable NSString *)assetUrlOverride {
  return self.rawManifestJSON[@"assetUrlOverride"];
}

@end
