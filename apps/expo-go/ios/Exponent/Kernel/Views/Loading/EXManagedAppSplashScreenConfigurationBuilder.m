#import <UIKit/UIKit.h>

#import "EXManagedAppSplashScreenConfigurationBuilder.h"
#import "EXUtil.h"

@import EXManifests;

static const NSString *kManifestIosKey = @"ios";
static const NSString *kManifestSplashKey = @"splash";
static const NSString *kManifestResizeModeKey = @"resizeMode";
static const NSString *kManifestBackgroundColorKey = @"backgroundColor";
static const NSString *kManifestTabletImageUrlKey = @"tabletImageUrl";
static const NSString *kManifestImageUrlKey = @"imageUrl";

static const NSString *kImageResizeModeContain = @"contain";
static const NSString *kImageResizeModeCover = @"cover";

@implementation EXManagedAppSplashScreenConfigurationBuilder

+ (EXManagedAppSplashScreenConfiguration *)parseManifest:(EXManifestsManifest *)manifest
{
  UIColor *backgroundColor = [[self class] parseBackgroundColor:manifest];
  NSString *imageUrl = [[self class] parseImageUrl:manifest];
  EXSplashScreenImageResizeMode imageResizeMode = [[self class] parseImageResizeMode:manifest];
  return [[EXManagedAppSplashScreenConfiguration alloc] initWithBackgroundColor:backgroundColor
                                                                       imageUrl:imageUrl
                                                                imageResizeMode:imageResizeMode];
}

+ (UIColor * _Nonnull)parseBackgroundColor:(EXManifestsManifest *)manifest
{
  // TODO: (@bbarthec) backgroundColor is recommended to be in HEX format for now, but it should be any css-valid format
  NSString *hexString = manifest.iosSplashBackgroundColor;
  UIColor *color = [EXUtil colorWithHexString:hexString];
  if (color) {
    return color;
  }

  return [UIColor whiteColor];
}

+ (NSString * _Nullable)parseImageUrl:(EXManifestsManifest *)manifest
{
  NSDictionary *plugin = [manifest getPluginPropertiesWithPackageName:@"expo-splash-screen"];
  NSString *image = [plugin valueForKey:@"image"];
  if (image) {
    NSURL *url = [NSURL URLWithString:manifest.bundleUrl];
    NSString *schemeAndHost = [NSString stringWithFormat:@"%@://%@:%@", url.scheme, url.host, url.port];
    NSString *result = [NSString stringWithFormat:@"%@/assets/%@", schemeAndHost, image];
    return result;
  }
  return manifest.iosSplashImageUrl;
}

+ (EXSplashScreenImageResizeMode)parseImageResizeMode:(EXManifestsManifest *)manifest
{
  NSString *resizeMode = manifest.iosSplashImageResizeMode;
  if ([kImageResizeModeCover isEqualToString:resizeMode]) {
    return EXSplashScreenImageResizeModeCover;
  }
  return EXSplashScreenImageResizeModeContain;
}

@end
