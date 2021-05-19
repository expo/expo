//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBareRawManifest.h>

@implementation EXUpdatesBareRawManifest

- (nullable NSString *)rawId {
  return [self.rawManifestJSON nullableStringForKey:@"id"];
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
