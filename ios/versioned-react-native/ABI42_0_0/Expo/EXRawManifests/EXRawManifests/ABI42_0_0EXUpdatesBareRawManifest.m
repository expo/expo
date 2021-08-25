//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI42_0_0EXRawManifests/ABI42_0_0EXUpdatesBareRawManifest.h>

@implementation ABI42_0_0EXUpdatesBareRawManifest

- (NSString *)rawId {
  return [self.rawManifestJSON stringForKey:@"id"];
}

- (NSNumber *)commitTimeNumber {
  return [self.rawManifestJSON numberForKey:@"commitTime"];
}

- (NSDictionary *)metadata {
  return [self.rawManifestJSON nullableDictionaryForKey:@"metadata"];
}

- (nullable NSArray *)assets {
  return [self.rawManifestJSON nullableArrayForKey:@"assets"];
}

@end
