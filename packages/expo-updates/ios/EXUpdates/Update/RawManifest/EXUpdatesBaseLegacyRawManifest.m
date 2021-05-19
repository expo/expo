//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBaseLegacyRawManifest.h>
#import <EXUpdates/NSDictionary+EXUpdatesRawManifest.h>

@implementation EXUpdatesBaseLegacyRawManifest

- (nullable NSString *)stableLegacyId {
  NSString *originalFullName = [self.rawManifestJSON nullableStringForKey:@"originalFullName"];
  if (originalFullName) {
    return originalFullName;
  } else {
    return [self legacyId];
  }
}

- (NSString *)bundleUrl {
  return [self.rawManifestJSON stringForKey:@"bundleUrl"];
}

- (nullable NSString *)sdkVersion {
  return [self.rawManifestJSON nullableStringForKey:@"sdkVersion"];
}

- (nullable NSArray *)assets {
  return [self.rawManifestJSON nullableArrayForKey:@"assets"];
}

@end
