//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBareRawManifest.h>

@implementation EXUpdatesBareRawManifest

- (nonnull NSNumber *)commitTimeNumber {
  return self.rawManifestJSON[@"commitTime"];
}

- (NSDictionary *)metadata {
  return self.rawManifestJSON[@"metadata"];
}

@end
