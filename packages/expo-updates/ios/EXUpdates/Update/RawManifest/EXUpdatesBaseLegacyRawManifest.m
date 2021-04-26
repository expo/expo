//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBaseLegacyRawManifest.h>

@implementation EXUpdatesBaseLegacyRawManifest

- (NSString *)bundleUrl {
  return self.rawManifestJSON[@"bundleUrl"];
}

- (NSString *)sdkVersion {
  return self.rawManifestJSON[@"sdkVersion"];
}

- (nullable NSArray *)assets {
  return self.rawManifestJSON[@"assets"];
}

@end
