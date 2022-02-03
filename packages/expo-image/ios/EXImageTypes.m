// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXImage/EXImageTypes.h>

@implementation EXImageTypes

+ (EXImageCacheTypeEnum)convertToCacheTypeEnum:(SDImageCacheType)imageCacheType
{
  switch (imageCacheType) {
    case SDImageCacheTypeNone:
      return EXImageCacheNone;
    case SDImageCacheTypeDisk:
      return EXImageCacheDisk;
    case SDImageCacheTypeMemory:
      return EXImageCacheMemory;
    // The only other known SDImageCacheType value
    // is SDImageCacheTypeAll, which:
    // 1. doesn't make sense in the context of completion block,
    // 2. shouldn't ever end up as an argument to completion block.
    // All in all, we map other SDImageCacheType values to EXImageCacheUnknown.
    default:
      return EXImageCacheUnknown;
  }
}

+ (nullable NSString *)sdImageFormatToMediaType:(SDImageFormat)imageFormat
{
  switch (imageFormat) {
    case SDImageFormatUndefined:
      return nil;
    case SDImageFormatJPEG:
      return @"image/jpeg";
    case SDImageFormatPNG:
      return @"image/png";
    case SDImageFormatGIF:
      return @"image/gif";
    case SDImageFormatTIFF:
      return @"image/tiff";
    case SDImageFormatWebP:
      return @"image/webp";
    case SDImageFormatHEIC:
      return @"image/heic";
    case SDImageFormatHEIF:
      return @"image/heif";
    case SDImageFormatPDF:
      return @"application/pdf";
    case SDImageFormatSVG:
      return @"image/svg+xml";
    default:
      // On one hand we could remove this clause
      // and always ensure that we have handled
      // all supported formats (by erroring compilation
      // otherwise). On the other hand, we do support
      // overriding SDWebImage version, so EXImage
      // shouldn't fail to compile on SDWebImage versions
      // with
      return nil;
  }
}

+ (UIViewContentMode)resizeModeToContentMode:(RCTResizeMode)resizeMode
{
  return resizeMode == RCTResizeModeRepeat
  ? UIViewContentModeScaleToFill
  : (UIViewContentMode)resizeMode;
}

@end
