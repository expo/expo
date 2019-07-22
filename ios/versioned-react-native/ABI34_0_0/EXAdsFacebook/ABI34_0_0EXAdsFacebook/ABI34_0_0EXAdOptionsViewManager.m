// Copyright 2016-present 650 Industries. All rights reserved.
#import <ABI34_0_0EXAdsFacebook/ABI34_0_0EXAdOptionsViewManager.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUtilities.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUIManager.h>
#import <ABI34_0_0EXAdsFacebook/ABI34_0_0EXNativeAdView.h>

@interface ABI34_0_0EXAdOptionsViewManager ()

@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI34_0_0EXAdOptionsViewManager

ABI34_0_0UM_EXPORT_MODULE(AdOptionsViewManager)

- (NSString *)viewName
{
  return @"AdOptionsView";
}

- (UIView *)view
{
  return [[FBAdOptionsView alloc] init];
}

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI34_0_0UM_VIEW_PROPERTY(nativeAdViewTag, NSNumber *, FBAdOptionsView)
{
  id<ABI34_0_0UMUIManager> uiManager = [_moduleRegistry getModuleImplementingProtocol:@protocol(ABI34_0_0UMUIManager)];
  [uiManager addUIBlock:^(ABI34_0_0EXNativeAdView *view) {
    [view setNativeAd:view.nativeAd];
  } forView:value ofClass:[ABI34_0_0EXNativeAdView class]];
}

ABI34_0_0UM_VIEW_PROPERTY(iconColor, NSString *, FBAdOptionsView)
{
  view.foregroundColor = [ABI34_0_0EXAdOptionsViewManager colorFromHexString:value];
}

+ (UIColor *)colorFromHexString:(NSString *)hexString {
  unsigned rgbValue = 0;
  NSScanner *scanner = [NSScanner scannerWithString:hexString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16)/255.0 green:((rgbValue & 0xFF00) >> 8)/255.0 blue:(rgbValue & 0xFF)/255.0 alpha:1.0];
}

@end
