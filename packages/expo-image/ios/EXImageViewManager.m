// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageViewManager.h>
#import <expo-image/EXImageView.h>
#import <SDWebImage/SDImageCodersManager.h>
#import <SDWebImageWebPCoder/SDWebImageWebPCoder.h>

#import <React/RCTImageShadowView.h>

@implementation EXImageViewManager

RCT_EXPORT_MODULE(ExpoImage)

- (RCTShadowView *)shadowView
{
  return [RCTImageShadowView new];
}

+ (void)initialize
{
  SDImageWebPCoder *webPCoder = [SDImageWebPCoder sharedCoder];
  if (![[SDImageCodersManager sharedManager].coders containsObject:webPCoder]) {
    [[SDImageCodersManager sharedManager] addCoder:webPCoder];
  }
}

RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, RCTResizeMode)

RCT_EXPORT_VIEW_PROPERTY(onLoadStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)

RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)

- (UIView *)view
{
  return [[EXImageView alloc] initWithBridge:self.bridge];
}

@end
