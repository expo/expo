//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifestFactory.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsLegacyManifest.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsNewManifest.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsBareManifest.h>

@implementation ABI44_0_0EXManifestsManifestFactory

+ (nonnull ABI44_0_0EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON {
  ABI44_0_0EXManifestsManifest *manifest;
  if (manifestJSON[@"releaseId"]) {
    manifest = [[ABI44_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else if (manifestJSON[@"metadata"]) {
    manifest = [[ABI44_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else {
    manifest = [[ABI44_0_0EXManifestsBareManifest alloc] initWithRawManifestJSON:manifestJSON];
  }
  return manifest;
}

@end
