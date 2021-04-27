//  Copyright © 2021 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBaseRawManifest.h>

@implementation EXUpdatesBaseRawManifest

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

- (NSString *)rawID {
  return self.rawManifestJSON[@"id"];
}

- (NSString *)revisionId {
  return self.rawManifestJSON[@"revisionId"];
}

- (nullable NSString *)slug {
  return self.rawManifestJSON[@"slug"];
}

- (nullable NSString *)appKey {
  return self.rawManifestJSON[@"appKey"];
}

- (nullable NSString *)name {
  return self.rawManifestJSON[@"name"];
}

- (nullable NSDictionary *)notificationPreferences {
  return self.rawManifestJSON[@"notification"];
}

- (nullable NSDictionary *)updatesInfo {
  return self.rawManifestJSON[@"updates"];
}

- (nullable NSDictionary *)iosConfig {
  return self.rawManifestJSON[@"ios"];
}

- (nullable NSString *)hostUri {
  return self.rawManifestJSON[@"hostUri"];
}

- (nullable NSString *)orientation {
  return self.rawManifestJSON[@"orientation"];
}

# pragma mark - Derived Methods

- (BOOL)isDevelopmentMode {
  NSDictionary *manifestPackagerOptsConfig = self.rawManifestJSON[@"packagerOpts"];
  return (self.rawManifestJSON[@"developer"] != nil && manifestPackagerOptsConfig != nil && [@(YES) isEqualToNumber:manifestPackagerOptsConfig[@"dev"]]);
}

- (BOOL)isDevelopmentSilentLaunch {
  NSDictionary *developmentClientSettings = self.rawManifestJSON[@"developmentClient"];
  if (developmentClientSettings && [developmentClientSettings isKindOfClass:[NSDictionary class]]) {
    id silentLaunch = developmentClientSettings[@"silentLaunch"];
    return silentLaunch && [@(YES) isEqual:silentLaunch];
  }
  return false;
}

- (BOOL)isUsingDeveloperTool {
  NSDictionary *manifestDeveloperConfig = self.rawManifestJSON[@"developer"];
  BOOL isDeployedFromTool = (manifestDeveloperConfig && manifestDeveloperConfig[@"tool"] != nil);
  return (isDeployedFromTool);
}

- (nullable NSString *)userInterfaceStyle {
  if (self.iosConfig && self.iosConfig[@"userInterfaceStyle"]) {
    return self.iosConfig[@"userInterfaceStyle"];
  }
  return self.rawManifestJSON[@"userInterfaceStyle"];
}

- (nullable NSString *)androidOrRootBackroundColor {
  if (self.iosConfig && self.iosConfig[@"backgroundColor"]) {
    return self.iosConfig[@"backgroundColor"];
  }
  return self.rawManifestJSON[@"backgroundColor"];
}

- (nullable NSString *)iosSplashBackgroundColor {
  return [[self class] getStringFromManifest:self.rawManifestJSON
                                       paths:@[
                                         @[@"ios", @"splash", @"backgroundColor"],
                                         @[@"splash", @"backgroundColor"],
                                       ]];
}

- (nullable NSString *)iosSplashImageUrl {
  return [[self class] getStringFromManifest:self.rawManifestJSON
                                       paths:@[
                                         [UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad
                                         ? @[@"ios", @"splash", @"tabletImageUrl"]
                                         : @[],
                                         @[@"ios", @"splash", @"imageUrl"],
                                         @[@"splash", @"imageUrl"],
                                       ]];
}

- (nullable NSString *)iosSplashImageResizeMode {
  return [[self class] getStringFromManifest:self.rawManifestJSON
                                       paths:@[
                                         @[@"ios", @"splash", @"resizeMode"],
                                         @[@"splash", @"resizeMode"],
                                       ]];
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
