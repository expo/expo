// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageView.h>
#import <React/RCTConvert.h>

static NSString * const sourceUriKey = @"uri";

@interface EXImageView ()

@property (nonatomic, strong) NSURL *imageURL;

@end

@implementation EXImageView

- (void)dealloc
{
  // Stop any active operations or downloads
  [self sd_cancelCurrentImageLoad];
}

# pragma mark -  Custom prop setters

- (void)setSource:(NSDictionary *)source
{
  _imageURL = [RCTConvert NSURL:source[sourceUriKey]];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if ([changedProps containsObject:@"source"]) {
    [self updateImage];
  }
}

- (void)updateImage
{
  // We want to call onError, onLoadEnd for the previous image load
  // before calling onLoadStart for the next image load.
  [self sd_cancelCurrentImageLoad];

  if (self.onLoadStart) {
    self.onLoadStart(@{});
  }

  [self sd_setImageWithURL:_imageURL
          placeholderImage:nil
                   options:0
                  progress:[self progressBlock]
                 completed:[self completionBlock]];
}

- (SDImageLoaderProgressBlock)progressBlock
{
  __weak EXImageView *weakSelf = self;
  return ^(NSInteger receivedSize, NSInteger expectedSize, NSURL * _Nullable targetURL) {
    __strong EXImageView *strongSelf = weakSelf;
    if (!strongSelf) {
      // Nothing to do
      return;
    }

    if (strongSelf.onProgress) {
      strongSelf.onProgress(@{
        @"loaded": @(receivedSize),
        @"total": @(expectedSize)
      });
    }
  };
}

- (SDExternalCompletionBlock)completionBlock
{
  __weak EXImageView *weakSelf = self;
  return ^(UIImage * _Nullable image, NSError * _Nullable error, SDImageCacheType cacheType, NSURL * _Nullable imageURL) {
    __strong EXImageView *strongSelf = weakSelf;
    if (!strongSelf) {
      // Nothing to do
      return;
    }

    if (error && strongSelf.onError) {
      strongSelf.onError(@{
        @"error": error.localizedDescription,
        @"ios": @{
            @"code": @(error.code),
            @"domain": error.domain,
            @"description": error.localizedDescription,
            @"helpAnchor": error.helpAnchor ?: [NSNull null],
            @"failureReason": error.localizedFailureReason ?: [NSNull null],
            @"recoverySuggestion": error.localizedRecoverySuggestion ?: [NSNull null]
        }
      });
    } else if (image && strongSelf.onLoad) {
      strongSelf.onLoad(@{
        @"cacheType": @([self convertToCacheTypeEnum:cacheType]),
        @"source": @{
            @"url": imageURL.absoluteString,
            @"width": @(image.size.width),
            @"height": @(image.size.height),
            @"mediaType": [self sdImageFormatToMediaType:image.sd_imageFormat] ?: [NSNull null]
        }
      });
    }
  };
}

- (EXImageCacheTypeEnum)convertToCacheTypeEnum:(SDImageCacheType)imageCacheType
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

- (nullable NSString *)sdImageFormatToMediaType:(SDImageFormat)imageFormat
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
      // overriding SDWebImage version, so expo-image
      // shouldn't fail to compile on SDWebImage versions
      // with
      return nil;
  }
}

@end
