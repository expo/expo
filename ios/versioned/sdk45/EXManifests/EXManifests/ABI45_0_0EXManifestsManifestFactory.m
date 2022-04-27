//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsManifestFactory.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsLegacyManifest.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsNewManifest.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsBareManifest.h>

@implementation ABI45_0_0EXManifestsManifestFactory

+ (nonnull ABI45_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON {
  ABI45_0_0EXManifestsManifest *manifest;
  if (manifestJSON[@"releaseId"]) {
    manifest = [[ABI45_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else if (manifestJSON[@"metadata"]) {
    manifest = [[ABI45_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else {
    manifest = [[ABI45_0_0EXManifestsBareManifest alloc] initWithRawManifestJSON:manifestJSON];
  }
  return manifest;
}

@end
