//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXManifests/EXManifestsBaseManifest.h>

#import <UIKit/UIKit.h>

@implementation EXManifestsBaseManifest

- (instancetype)initWithRawManifestJSON:(NSDictionary *)rawManifestJSON {
  if (self = [super init]) {
    _rawManifestJSON = rawManifestJSON;
  }
  return self;
}

- (NSString *)description {
   return self.rawManifestJSON.description;
}

# pragma mark - Field Getters

- (NSString *)legacyId {
  return [self.rawManifestJSON stringForKey:@"id"];
}

- (nullable NSString *)revisionId {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"revisionId"];
}

- (nullable NSString *)slug {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"slug"];
}

- (nullable NSString *)appKey {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"appKey"];
}

- (nullable NSString *)name {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"name"];
}

- (nullable NSString *)version {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"version"];
}

- (nullable NSDictionary *)notificationPreferences {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableDictionaryForKey:@"notification"];
}

- (nullable NSDictionary *)updatesInfo {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableDictionaryForKey:@"updates"];
}

- (nullable NSDictionary *)iosConfig {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableDictionaryForKey:@"ios"];
}

- (nullable NSString *)hostUri {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"hostUri"];
}

- (nullable NSString *)orientation {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"orientation"];
}

- (nullable NSDictionary *)experiments {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableDictionaryForKey:@"experiments"];
}

- (nullable NSDictionary *)developer {
  NSDictionary *expoGoConfig = self.expoGoConfigRootObject;
  if (!expoGoConfig) {
    return nil;
  }
  return [expoGoConfig nullableDictionaryForKey:@"developer"];
}

- (nullable NSString *)logUrl {
  NSDictionary *expoGoConfig = self.expoGoConfigRootObject;
  if (!expoGoConfig) {
    return nil;
  }
  return [expoGoConfig nullableStringForKey:@"logUrl"];
}

- (nullable NSString *)facebookAppId {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"facebookAppId"];
}

- (nullable NSString *)facebookApplicationName {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"facebookDisplayName"];
}

- (BOOL)facebookAutoInitEnabled {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  NSNumber *enabledNumber = [expoClientConfig nullableNumberForKey:@"facebookAutoInitEnabled"];
  return enabledNumber != nil && [enabledNumber boolValue];
}

# pragma mark - Derived Methods

- (BOOL)isDevelopmentMode {
  NSDictionary *expoGoConfig = self.expoGoConfigRootObject;
  if (!expoGoConfig) {
    return nil;
  }
  NSDictionary *manifestPackagerOptsConfig = [expoGoConfig nullableDictionaryForKey:@"packagerOpts"];
  return (self.developer != nil && manifestPackagerOptsConfig != nil && [@(YES) isEqualToNumber:manifestPackagerOptsConfig[@"dev"]]);
}

- (BOOL)isDevelopmentSilentLaunch {
  NSDictionary *expoGoConfig = self.expoGoConfigRootObject;
  if (!expoGoConfig) {
    return nil;
  }
  NSDictionary *developmentClientSettings = expoGoConfig[@"developmentClient"];
  if (developmentClientSettings && [developmentClientSettings isKindOfClass:[NSDictionary class]]) {
    id silentLaunch = developmentClientSettings[@"silentLaunch"];
    return silentLaunch && [@(YES) isEqual:silentLaunch];
  }
  return false;
}

- (BOOL)isUsingDeveloperTool {
  BOOL isDeployedFromTool = (self.developer && self.developer[@"tool"] != nil);
  return (isDeployedFromTool);
}

- (nullable NSString *)userInterfaceStyle {
  if (self.iosConfig && [self.iosConfig nullableStringForKey:@"userInterfaceStyle"]) {
    return [self.iosConfig nullableStringForKey:@"userInterfaceStyle"];
  }
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"userInterfaceStyle"];
}

- (nullable NSString *)iosOrRootBackgroundColor {
  if (self.iosConfig && [self.iosConfig nullableStringForKey:@"backgroundColor"]) {
    return [self.iosConfig nullableStringForKey:@"backgroundColor"];
  }
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [expoClientConfig nullableStringForKey:@"backgroundColor"];
}

- (nullable NSString *)iosSplashBackgroundColor {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [[self class] getStringFromManifest:expoClientConfig
                                       paths:@[
                                         @[@"ios", @"splash", @"backgroundColor"],
                                         @[@"splash", @"backgroundColor"],
                                       ]];
}

- (nullable NSString *)iosSplashImageUrl {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [[self class] getStringFromManifest:expoClientConfig
                                       paths:@[
                                         [UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad
                                         ? @[@"ios", @"splash", @"tabletImageUrl"]
                                         : @[],
                                         @[@"ios", @"splash", @"imageUrl"],
                                         @[@"splash", @"imageUrl"],
                                       ]];
}

- (nullable NSString *)iosSplashImageResizeMode {
  NSDictionary *expoClientConfig = self.expoClientConfigRootObject;
  if (!expoClientConfig) {
    return nil;
  }
  return [[self class] getStringFromManifest:expoClientConfig
                                       paths:@[
                                         @[@"ios", @"splash", @"resizeMode"],
                                         @[@"splash", @"resizeMode"],
                                       ]];
}

- (nullable NSString *)iosGoogleServicesFile {
  if (self.iosConfig) {
    return [self.iosConfig nullableStringForKey:@"googleServicesFile"];
  }
  return nil;
}

- (nullable NSDictionary *)expoClientConfigRootObject {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

- (nullable NSDictionary *)expoGoConfigRootObject {
  @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                 reason:[NSString stringWithFormat:@"You must override %@ in a subclass", NSStringFromSelector(_cmd)]
                               userInfo:nil];
}

+ (NSString * _Nullable)getStringFromManifest:(NSDictionary *)manifest
                                        paths:(NSArray<NSArray<const NSString *> *> *)paths
{
  for (NSArray<const NSString *> *path in paths) {
    NSString *result = [[self class] getStringFromManifest:manifest path:path];
    if (result) {
      return result;
    }
  }
  return nil;
}

+ (NSString * _Nullable)getStringFromManifest:(NSDictionary *)manifest
                                         path:(NSArray<const NSString *> *)path
{
  NSDictionary *json = manifest;
  for (int i = 0; i < path.count; i++) {
    BOOL isLastKey = i == path.count - 1;
    const NSString *key = path[i];
    id value = json[key];
    if (isLastKey && [value isKindOfClass:[NSString class]]) {
      return value;
    }
    json = value;
  }
  return nil;
}

@end
