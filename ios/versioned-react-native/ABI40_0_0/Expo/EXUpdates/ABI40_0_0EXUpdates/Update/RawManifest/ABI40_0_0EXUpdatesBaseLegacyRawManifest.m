//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesBaseLegacyRawManifest.h>
#import <ABI40_0_0EXUpdates/NSDictionary+ABI40_0_0EXUpdatesRawManifest.h>

@implementation ABI40_0_0EXUpdatesBaseLegacyRawManifest

- (NSString *)bundleUrl {
  return [self.rawManifestJSON stringForKey:@"bundleUrl"];
}

- (nullable NSString *)sdkVersion {
  return [self.rawManifestJSON nullableStringForKey:@"sdkVersion"];
}

@end
