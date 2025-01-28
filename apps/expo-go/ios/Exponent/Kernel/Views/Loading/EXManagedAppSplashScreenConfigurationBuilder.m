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
  // Because of the changes to splashscreen, we now default to the app icon in expo go
  return manifest.iosAppIconUrl;
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
