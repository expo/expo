//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsManifestFactory.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsLegacyManifest.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsNewManifest.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsBareManifest.h>

@implementation ABI42_0_0EXManifestsManifestFactory

+ (nonnull ABI42_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON {
  ABI42_0_0EXManifestsManifest *manifest;
  if (manifestJSON[@"releaseId"]) {
    manifest = [[ABI42_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else if (manifestJSON[@"metadata"]) {
    manifest = [[ABI42_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else {
    manifest = [[ABI42_0_0EXManifestsBareManifest alloc] initWithRawManifestJSON:manifestJSON];
  }
  return manifest;
}

@end
