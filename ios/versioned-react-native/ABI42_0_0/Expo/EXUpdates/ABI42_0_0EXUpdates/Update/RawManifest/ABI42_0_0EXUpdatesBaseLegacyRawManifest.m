//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesBaseLegacyRawManifest.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0NSDictionary+EXUpdatesRawManifest.h>

@implementation ABI42_0_0EXUpdatesBaseLegacyRawManifest

- (NSString *)bundleUrl {
  return [self.rawManifestJSON stringForKey:@"bundleUrl"];
}

- (nullable NSString *)sdkVersion {
  return [self.rawManifestJSON nullableStringForKey:@"sdkVersion"];
}

@end
