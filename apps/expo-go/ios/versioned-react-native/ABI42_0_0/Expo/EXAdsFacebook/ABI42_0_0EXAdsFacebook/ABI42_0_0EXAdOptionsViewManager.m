// Copyright 2016-present 650 Industries. All rights reserved.
#import <ABI42_0_0EXAdsFacebook/ABI42_0_0EXAdOptionsViewManager.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUIManager.h>
#import <ABI42_0_0EXAdsFacebook/ABI42_0_0EXNativeAdView.h>

@interface ABI42_0_0EXAdOptionsViewManager ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI42_0_0EXAdOptionsViewManager

ABI42_0_0UM_EXPORT_MODULE(AdOptionsViewManager)

- (NSString *)viewName
{
  return @"AdOptionsView";
}

- (UIView *)view
{
  return [[FBAdOptionsView alloc] init];
}

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI42_0_0UM_VIEW_PROPERTY(nativeAdViewTag, NSNumber *, FBAdOptionsView)
{
  id<ABI42_0_0UMUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMUIManager)];
  [uiManager addUIBlock:^(ABI42_0_0EXNativeAdView *view) {
    [view setNativeAd:view.nativeAd];
  } forView:value ofClass:[ABI42_0_0EXNativeAdView class]];
}

ABI42_0_0UM_VIEW_PROPERTY(iconColor, NSString *, FBAdOptionsView)
{
  view.foregroundColor = [ABI42_0_0EXAdOptionsViewManager colorFromHexString:value];
}

+ (UIColor *)colorFromHexString:(NSString *)hexString {
  unsigned rgbValue = 0;
  NSScanner *scanner = [NSScanner scannerWithString:hexString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16)/255.0 green:((rgbValue & 0xFF00) >> 8)/255.0 blue:(rgbValue & 0xFF)/255.0 alpha:1.0];
}

@end
