//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsManifestFactory.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsLegacyManifest.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsNewManifest.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsBareManifest.h>

@implementation ABI48_0_0EXManifestsManifestFactory

+ (nonnull ABI48_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON {
  ABI48_0_0EXManifestsManifest *manifest;
  if (manifestJSON[@"releaseId"]) {
    manifest = [[ABI48_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else if (manifestJSON[@"metadata"]) {
    manifest = [[ABI48_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else {
    manifest = [[ABI48_0_0EXManifestsBareManifest alloc] initWithRawManifestJSON:manifestJSON];
  }
  return manifest;
}

@end
