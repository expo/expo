//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsBareRawManifest.h>

@implementation ABI41_0_0EXManifestsBareRawManifest

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
