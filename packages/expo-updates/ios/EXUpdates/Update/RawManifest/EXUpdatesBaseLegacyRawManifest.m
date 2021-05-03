//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBaseLegacyRawManifest.h>
#import <EXUpdates/NSDictionary+EXUpdatesRawManifest.h>

@implementation EXUpdatesBaseLegacyRawManifest

- (NSString *)bundleUrl {
  return [self.rawManifestJSON stringForKey:@"bundleUrl"];
}

- (nullable NSString *)sdkVersion {
  return [self.rawManifestJSON nullableStringForKey:@"sdkVersion"];
}

@end
