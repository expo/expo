//  Copyright © 2021 650 Industries. All rights reserved.

#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsBareManifest.h>

@implementation ABI48_0_0EXManifestsBareManifest

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
