// Copyright 2016-present 650 Industries. All rights reserved.
#import <EXAdsFacebook/EXAdOptionsViewManager.h>
#import <UMCore/UMUtilities.h>
#import <UMCore/UMUIManager.h>
#import <EXAdsFacebook/EXNativeAdView.h>

@interface EXAdOptionsViewManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXAdOptionsViewManager

UM_EXPORT_MODULE(AdOptionsViewManager)

- (NSString *)viewName
{
  return @"AdOptionsView";
}

- (UIView *)view
{
  return [[FBAdOptionsView alloc] init];
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_VIEW_PROPERTY(nativeAdViewTag, NSNumber *, FBAdOptionsView)
{
  id<UMUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(UMUIManager)];
  [uiManager addUIBlock:^(EXNativeAdView *view) {
    [view setNativeAd:view.nativeAd];
  } forView:value ofClass:[EXNativeAdView class]];
}

UM_VIEW_PROPERTY(iconColor, NSString *, FBAdOptionsView)
{
  view.foregroundColor = [EXAdOptionsViewManager colorFromHexString:value];
}

+ (UIColor *)colorFromHexString:(NSString *)hexString {
  unsigned rgbValue = 0;
  NSScanner *scanner = [NSScanner scannerWithString:hexString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16)/255.0 green:((rgbValue & 0xFF00) >> 8)/255.0 blue:(rgbValue & 0xFF)/255.0 alpha:1.0];
}

@end
