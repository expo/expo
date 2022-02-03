// Copyright 2020-present 650 Industries. All rights reserved.

#import "EXImageCustomCoders.h"
#import <SDWebImage/SDImageCodersManager.h>
#import <SDWebImageWebPCoder/SDWebImageWebPCoder.h>
#if __has_include(<SDWebImageSVGCoder/SDImageSVGCoder.h>)
#import <SDWebImageSVGCoder/SDImageSVGCoder.h>
#endif
#import <SDWebImageSVGKitPlugin/SDImageSVGKCoder.h>

@implementation EXImageCustomCoders

+ (void)registerCustomCoders
{
  SDImageCodersManager *manager = [SDImageCodersManager sharedManager];
  
  id<SDImageCoder> svgCoder = [EXImageCustomCoders SVGCoder];
  SDImageWebPCoder *webPCoder = [EXImageCustomCoders WebPCoder];
  
  if (![manager.coders containsObject:webPCoder]) {
    [manager addCoder:webPCoder];
  }
  if (![manager.coders containsObject:svgCoder]) {
    [manager addCoder:svgCoder];
  }
}

+ (id<SDImageCoder>)SVGCoder
{
  // 1. SDWebImageSVGCoder is a non-dependency which users can
  //    add to their own Podfiles, if they would like to use it
  //    to decode SVGs on iOS 13+.
  // 2. It only works on iOS 13+, we cannot use it on older versions
  //    of iOS.
  //
  // Therefore to use SVGCoder we have to know it is available
  // and we are running on iOS 13+.
  id<SDImageCoder> svgCoder;
#if __has_include(<SDWebImageSVGCoder/SDImageSVGCoder.h>)
  if (@available(iOS 13, *)) {
    svgCoder = [SDImageSVGCoder sharedCoder];
  } else {
    svgCoder = [SDImageSVGKCoder sharedCoder];
  }
#else
  svgCoder = [SDImageSVGKCoder sharedCoder];
#endif
  return svgCoder;
}

+ (SDImageWebPCoder *)WebPCoder
{
  return [SDImageWebPCoder sharedCoder];
}


@end
