//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsBaseLegacyManifest.h>
#import <EXJSONUtils/NSDictionary+EXJSONUtils.h>

@implementation EXManifestsBaseLegacyManifest

- (nullable NSDictionary *)expoClientConfigRootObject {
  return self.rawManifestJSON;
}

- (nullable NSDictionary *)expoGoConfigRootObject {
  return self.rawManifestJSON;
}

- (NSString *)stableLegacyId {
  NSString *originalFullName = [self.rawManifestJSON nullableStringForKey:@"originalFullName"];
  if (originalFullName) {
    return originalFullName;
  } else {
    return [self legacyId];
  }
}

- (NSString *)scopeKey {
  NSString *scopeKey = [self.rawManifestJSON nullableStringForKey:@"scopeKey"];
  if (scopeKey) {
    return scopeKey;
  } else {
    return [self stableLegacyId];
  }
}

- (nullable NSString *)easProjectId {
  return [self.rawManifestJSON nullableStringForKey:@"projectId"];
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
