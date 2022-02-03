//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsManifestFactory.h>
#import <EXManifests/EXManifestsLegacyManifest.h>
#import <EXManifests/EXManifestsNewManifest.h>
#import <EXManifests/EXManifestsBareManifest.h>

@implementation EXManifestsManifestFactory

+ (nonnull EXManifestsManifest *)manifestForManifestJSON:(nonnull NSDictionary *)manifestJSON {
  EXManifestsManifest *manifest;
  if (manifestJSON[@"releaseId"]) {
    manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else if (manifestJSON[@"metadata"]) {
    manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:manifestJSON];
  } else {
    manifest = [[EXManifestsBareManifest alloc] initWithRawManifestJSON:manifestJSON];
  }
  return manifest;
}

@end
