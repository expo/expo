//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsManifestFactory.h>
#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsLegacyManifest.h>
#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsNewManifest.h>
#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsBareManifest.h>

@implementation ABI41_0_0EXManifestsManifestFactory

+ (nonnull ABI41_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON {
  ABI41_0_0EXManifestsManifest *manifest;
  if (manifestJSON[@"releaseId"]) {
    manifest = [[ABI41_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else if (manifestJSON[@"metadata"]) {
    manifest = [[ABI41_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else {
    manifest = [[ABI41_0_0EXManifestsBareManifest alloc] initWithRawManifestJSON:manifestJSON];
  }
  return manifest;
}

@end
