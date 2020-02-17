// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "EXSplashScreenConfig.h"

@implementation EXSplashScreenConfig

- (instancetype)initWithBackgroundColor:(UIColor * _Nonnull)backgroundColor
                             resizeMode:(EXSplashScreenImageResizeMode)resizeMode
                               imageUrl:(NSString * _Nullable)imageUrl
{
  if (self = [super init]) {
    _backgroundColor = backgroundColor;
    _resizeMode = resizeMode;
    _imageUrl = imageUrl;
  }
  return self;
}

+ (instancetype)fromManifest:(NSDictionary *)manifest
{
  UIColor *backgroundColor = [EXSplashScreenConfig parseBackgroundColor:manifest];
  EXSplashScreenImageResizeMode resizeMode = [EXSplashScreenConfig parseResizeMode:manifest];
  NSString *imageUrl = [EXSplashScreenConfig parseImageUrl:manifest];
  EXSplashScreenConfig *config = [[EXSplashScreenConfig alloc] initWithBackgroundColor:backgroundColor
                                                                            resizeMode:resizeMode
                                                                              imageUrl:imageUrl];
  return config;
}

+ (UIColor *)parseBackgroundColor:(NSDictionary *)manifest
{
  NSString *colorString = [EXSplashScreenConfig getStringFromManifest:manifest
                                                                   paths:@[@[@"ios", @"splash", @"backgroundColor"],
                                                                           @[@"splash", @"backgroundColor"]
                                                                   ]];
  UIColor *color = [EXSplashScreenConfig colorFromHEX:colorString];
  return color ? color : [UIColor whiteColor];
}

/**
 * Supported formats of hex string are: #RRGGBB, #AARRGGBB
 */
+ (UIColor *)colorFromHEX:(NSString *)hex
{
  if (!hex || (hex.length != 7 && hex.length != 9) || [hex characterAtIndex:0] != '#') {
    return nil;
  }
  BOOL hasAlpha = hex.length == 9;
  NSScanner *scanner = [NSScanner scannerWithString:[hex substringFromIndex:1]];
  unsigned int uintColor;
  if ([scanner scanHexInt:&uintColor]) {
    int alpha = !hasAlpha ? 255 : (uintColor >> 24) & 0xFF;
    int red = (uintColor >> 16) & 0xFF;
    int green = (uintColor >> 8) & 0xFF;
    int blue = uintColor & 0xFF;
    return [UIColor colorWithRed:red / 255.0f
                           green:green / 255.0f
                            blue:blue / 255.0f
                           alpha:alpha / 255.0f];
  }
  return nil;
}

+ (EXSplashScreenImageResizeMode)parseResizeMode:(NSDictionary *)manifest
{
  NSString *resizeMode = [EXSplashScreenConfig getStringFromManifest:manifest
                                                               paths:@[@[@"ios", @"splash", @"resizeMode"],
                                                                       @[@"splash", @"resizeMode"]
                                                               ]];
  if (resizeMode == nil || [resizeMode isEqualToString:@"contain"]) {
    return EXSplashScreenImageResizeMode_CONTAIN;
  } else if ([resizeMode isEqualToString:@"cover"]) {
    return EXSplashScreenImageResizeMode_COVER;
  }
  
  return EXSplashScreenImageResizeMode_CONTAIN;
}

+ (NSString * _Nullable)parseImageUrl:(NSDictionary *)manifest
{
  NSString *imageUrlKey = [UIDevice currentDevice].userInterfaceIdiom == UIUserInterfaceIdiomPad ? @"tabletImageUrl" : @"imageUrl";
  NSString *imageUrl = [EXSplashScreenConfig getStringFromManifest:manifest
                                                                paths:@[@[@"ios", @"splash", imageUrlKey],
                                                                        @[@"splash", imageUrlKey]
                                                                ]];
  return imageUrl;
}

+ (NSString * _Nullable)getStringFromManifest:(NSDictionary *)manifest paths:(NSArray<NSArray<NSString *> *> *)paths
{
  for (NSArray<NSString *> *path in paths) {
    NSString *result = [EXSplashScreenConfig getStringFromManifest:manifest path:path];
    if (result) {
      return result;
    }
  }
  return nil;
}

+ (NSString * _Nullable)getStringFromManifest:(NSDictionary *)manifest path:(NSArray<NSString *> *)path
{
  NSDictionary *dict = manifest;
  for (int i = 0; i < path.count; i++) {
    if (!dict) {
      return nil;
    }
    NSString *key = path[i];
    BOOL isLast = i == (path.count - 1);
    if (isLast) {
      if ([dict[key] isKindOfClass:[NSString class]]) {
        return dict[key];
      }
      return nil;
    }
    dict = dict[key];
  }
  return nil;
}

@end
