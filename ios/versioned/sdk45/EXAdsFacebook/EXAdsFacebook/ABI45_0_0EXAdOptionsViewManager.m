// Copyright 2016-present 650 Industries. All rights reserved.
#import <ABI45_0_0EXAdsFacebook/ABI45_0_0EXAdOptionsViewManager.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUtilities.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUIManager.h>
#import <ABI45_0_0EXAdsFacebook/ABI45_0_0EXNativeAdView.h>

@interface ABI45_0_0EXAdOptionsViewManager ()

@property (nonatomic, weak) ABI45_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI45_0_0EXAdOptionsViewManager

ABI45_0_0EX_EXPORT_MODULE(AdOptionsViewManager)

- (NSString *)viewName
{
  return @"AdOptionsView";
}

- (UIView *)view
{
  return [[FBAdOptionsView alloc] init];
}

- (void)setModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI45_0_0EX_VIEW_PROPERTY(nativeAdViewTag, NSNumber *, FBAdOptionsView)
{
  id<ABI45_0_0EXUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI45_0_0EXUIManager)];
  [uiManager addUIBlock:^(ABI45_0_0EXNativeAdView *view) {
    [view setNativeAd:view.nativeAd];
  } forView:value ofClass:[ABI45_0_0EXNativeAdView class]];
}

ABI45_0_0EX_VIEW_PROPERTY(iconColor, NSString *, FBAdOptionsView)
{
  view.foregroundColor = [ABI45_0_0EXAdOptionsViewManager colorFromHexString:value];
}

+ (UIColor *)colorFromHexString:(NSString *)hexString {
  unsigned rgbValue = 0;
  NSScanner *scanner = [NSScanner scannerWithString:hexString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16)/255.0 green:((rgbValue & 0xFF00) >> 8)/255.0 blue:(rgbValue & 0xFF)/255.0 alpha:1.0];
}

@end
