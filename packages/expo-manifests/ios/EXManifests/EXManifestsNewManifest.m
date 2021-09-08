//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsNewManifest.h>

@implementation EXManifestsNewManifest

- (NSString *)rawId {
  return [self.rawManifestJSON stringForKey:@"id"];
}

- (NSString *)stableLegacyId {
  return self.rawId;
}

- (NSString *)scopeKey {
  return [[self.rawManifestJSON dictionaryForKey:@"extra"] stringForKey:@"scopeKey"];
}

- (nullable NSString *)easProjectId {
  if (!self.extra) {
    return nil;
  }
  NSDictionary *easConfig = [self.extra nullableDictionaryForKey:@"eas"];
  if (!easConfig) {
    return nil;
  }
  return [easConfig nullableStringForKey:@"projectId"];
}

- (NSString *)createdAt {
  return [self.rawManifestJSON stringForKey:@"createdAt"];
}

- (nullable NSString *)sdkVersion {
  NSString *runtimeVersion = self.runtimeVersion;
  if ([runtimeVersion isEqualToString:@"exposdk:UNVERSIONED"]) {
    return @"UNVERSIONED";
  }
  
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

- (nullable NSDictionary *)extra {
  return [self.rawManifestJSON nullableDictionaryForKey:@"extra"];
}

- (nullable NSDictionary *)expoClientConfigRootObject {
  if (!self.extra) {
    return nil;
  }
  return [self.extra nullableDictionaryForKey:@"expoClient"];
}

- (nullable NSDictionary *)expoGoConfigRootObject {
  if (!self.extra) {
    return nil;
  }
  return [self.extra nullableDictionaryForKey:@"expoGo"];
}

@end
