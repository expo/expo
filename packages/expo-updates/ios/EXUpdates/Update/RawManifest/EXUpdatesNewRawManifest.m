//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesNewRawManifest.h>

@implementation EXUpdatesNewRawManifest

/**
 * An ID representing this manifest, not the ID for the experience.
 */
- (nullable NSString *)rawId {
  return [self.rawManifestJSON stringForKey:@"id"];
}

/**
 * Incorrect for now until we figure out how to get this in the new manifest format.
 */
- (nullable NSString *)stableLegacyId {
  return [self rawId];
}

- (NSString *)createdAt {
  return [self.rawManifestJSON stringForKey:@"createdAt"];
}

- (nullable NSString *)sdkVersion {
  NSString *runtimeVersion = self.runtimeVersion;
  NSRegularExpression *regex =
      [NSRegularExpression regularExpressionWithPattern:@"^exposdk:(\\d+\\.\\d+\\.\\d+)$"
                                                options:0
                                                  error:nil];
  NSTextCheckingResult *match = [regex firstMatchInString:runtimeVersion options:0 range:NSMakeRange(0, [runtimeVersion length])];
  if (match) {
    NSRange matchRange = [match rangeAtIndex:1];
    if (!NSEqualRanges(matchRange, NSMakeRange(NSNotFound, 0))) {
      return [runtimeVersion substringWithRange:matchRange];
    }
  }
  
  return nil;
}

- (NSString *)runtimeVersion {
  return [self.rawManifestJSON stringForKey:@"runtimeVersion"];
}

- (NSDictionary *)launchAsset {
  return [self.rawManifestJSON dictionaryForKey:@"launchAsset"];
}

- (nullable NSArray *)assets {
  return [self.rawManifestJSON nullableArrayForKey:@"assets"];
}

- (NSString *)bundleUrl {
  return [self.launchAsset stringForKey:@"url"];
}

@end
