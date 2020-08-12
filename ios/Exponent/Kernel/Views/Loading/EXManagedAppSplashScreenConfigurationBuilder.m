#import <UIKit/UIKit.h>

#import "EXManagedAppSplashScreenConfigurationBuilder.h"
#import "EXUtil.h"


static const NSString *kManifestIosKey = @"ios";
static const NSString *kManifestSplashKey = @"splash";
static const NSString *kManifestResizeModeKey = @"resizeMode";
static const NSString *kManifestBackgroundColorKey = @"backgroundColor";
static const NSString *kManifestTabletImageUrlKey = @"tabletImageUrl";
static const NSString *kManifestImageUrlKey = @"imageUrl";

static const NSString *kImageResizeModeContain = @"contain";
static const NSString *kImageResizeModeCover = @"cover";

@implementation EXManagedAppSplashScreenConfigurationBuilder

+ (EXSplashScreenConfiguration *)parseManifest:(NSDictionary *)manifest
{
  UIColor *backgroundColor = [[self class] parseBackgroundColor:manifest];
  NSString *imageUrl = [[self class] parseImageUrl:manifest];
  EXSplashScreenImageResizeMode imageResizeMode = [[self class] parseImageResizeMode:manifest];
  return [[EXSplashScreenConfiguration alloc] initWithBackgroundColor:backgroundColor
                                                             imageUrl:imageUrl
                                                      imageResizeMode:imageResizeMode];
}

+ (UIColor * _Nonnull)parseBackgroundColor:(NSDictionary *)manifest
{
  // TODO: (@bbarthec) is backgroundColor always in HEX format on iOS? (most possibly it is not)
  NSString *hexString = [[self class] getStringFromManifest:manifest
                                                      paths:@[
                                                        @[kManifestIosKey, kManifestSplashKey, kManifestBackgroundColorKey],
                                                        @[kManifestSplashKey, kManifestBackgroundColorKey],
                                                      ]];
  UIColor *color = [EXUtil colorWithHexString:hexString];
  if (color) {
    return color;
  }
  
  return [UIColor whiteColor];
}

+ (NSString * _Nullable)parseImageUrl:(NSDictionary *)manifest
{
  return [[self class] getStringFromManifest:manifest
                                       paths:@[
                                         [UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad
                                           ? @[kManifestIosKey, kManifestSplashKey, kManifestTabletImageUrlKey]
                                           : @[],
                                         @[kManifestIosKey, kManifestSplashKey, kManifestImageUrlKey],
                                         @[kManifestSplashKey, kManifestImageUrlKey],
                                       ]];
}

+ (EXSplashScreenImageResizeMode)parseImageResizeMode:(NSDictionary *)manifest
{
  NSString *resizeMode = [[self class] getStringFromManifest:manifest
                                                       paths:@[
                                                         @[kManifestIosKey, kManifestSplashKey, kManifestResizeModeKey],
                                                         @[kManifestSplashKey, kManifestResizeModeKey],
                                                       ]];
  if ([kImageResizeModeCover isEqualToString:resizeMode]) {
    return EXSplashScreenImageResizeModeCover;
  }
  return EXSplashScreenImageResizeModeContain;
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
