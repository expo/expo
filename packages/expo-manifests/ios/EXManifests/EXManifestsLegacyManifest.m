//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsLegacyManifest.h>

@implementation EXManifestsLegacyManifest

# pragma mark - Field Methods

- (NSString *)releaseID {
  return [self.rawManifestJSON stringForKey:@"releaseId"];
}

- (NSString *)commitTime {
  return [self.rawManifestJSON stringForKey:@"commitTime"];
}

- (nullable NSArray *)bundledAssets {
  return [self.rawManifestJSON nullableArrayForKey:@"bundledAssets"];
}

- (nullable id)runtimeVersion {
  return self.rawManifestJSON[@"runtimeVersion"];
}

- (nullable NSString *)bundleKey {
  return [self.rawManifestJSON nullableStringForKey:@"bundleKey"];
}

- (nullable NSString *)assetUrlOverride {
  return [self.rawManifestJSON nullableStringForKey:@"assetUrlOverride"];
}

@end
