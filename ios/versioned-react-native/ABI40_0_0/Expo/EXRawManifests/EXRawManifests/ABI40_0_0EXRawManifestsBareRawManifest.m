//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsBareRawManifest.h>

@implementation ABI40_0_0EXRawManifestsBareRawManifest

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
