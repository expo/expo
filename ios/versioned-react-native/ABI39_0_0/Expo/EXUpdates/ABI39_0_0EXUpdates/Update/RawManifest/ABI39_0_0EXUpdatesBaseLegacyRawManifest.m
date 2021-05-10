//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesBaseLegacyRawManifest.h>
#import <ABI39_0_0EXUpdates/NSDictionary+ABI39_0_0EXUpdatesRawManifest.h>

@implementation ABI39_0_0EXUpdatesBaseLegacyRawManifest

- (NSString *)bundleUrl {
  return [self.rawManifestJSON stringForKey:@"bundleUrl"];
}

- (nullable NSString *)sdkVersion {
  return [self.rawManifestJSON nullableStringForKey:@"sdkVersion"];
}

@end
