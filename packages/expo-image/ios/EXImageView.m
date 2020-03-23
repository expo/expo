// Copyright 2020-present 650 Industries. All rights reserved.

#import <expo-image/EXImageView.h>
#import <React/RCTConvert.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

static NSString * const sourceUriKey = @"uri";
static NSString * const sourceScaleKey = @"scale";
static NSString * const sourceWidthKey = @"width";
static NSString * const sourceHeightKey = @"height";

@interface EXImageView ()

@property (nonatomic, strong) NSDictionary *source;
@property (nonatomic, assign) RCTResizeMode resizeMode;
@property (nonatomic, assign) BOOL needsReload;
@property (nonatomic, assign) CGSize intrinsicContentSize;

@end

@implementation EXImageView
{
  __weak RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
    _needsReload = NO;
    _resizeMode = RCTResizeModeCover;
    _intrinsicContentSize = CGSizeZero;
    self.contentMode = (UIViewContentMode)_resizeMode;
  }
  return self;
}

- (void)dealloc
{
  // Stop any active operations or downloads
  [self sd_cancelCurrentImageLoad];
}

# pragma mark -  Custom prop setters

- (void)setSource:(NSDictionary *)source
{
  _source = source;
  // TODO: Implement equatable image source abstraction
  _needsReload = YES;
}

- (void)setResizeMode:(RCTResizeMode)resizeMode
{
  if (_resizeMode == resizeMode) {
    return;
  }
  
  // Image needs to be reloaded whenever repeat is enabled or disabled
  _needsReload = _needsReload || (resizeMode == RCTResizeModeRepeat) || (_resizeMode == RCTResizeModeRepeat);
  _resizeMode = resizeMode;
  
  // Repeat resize mode is handled by the UIImage. Use scale to fill
  // so the repeated image fills the UIImageView.
  self.contentMode = resizeMode == RCTResizeModeRepeat
    ? UIViewContentModeScaleToFill
    : (UIViewContentMode)resizeMode;
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if (_needsReload) {
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

  NSURL *imageUrl = _source ? [RCTConvert NSURL:_source[sourceUriKey]] : nil;
  NSNumber *scale = _source && _source[sourceScaleKey] ? _source[sourceScaleKey] : nil;
  NSNumber *width = _source && _source[sourceWidthKey] ? _source[sourceWidthKey] : nil;
  NSNumber *height = _source && _source[sourceHeightKey] ? _source[sourceHeightKey] : nil;
  RCTResizeMode resizeMode = _resizeMode;
  
  // For local assets, the intrinsic image size is passed down in the source.
  // This means we can set it immediately without having to wait for the
  // image content to load.
  if (width && height) {
    [self updateIntrinsicContentSize:CGSizeMake(width.doubleValue, height.doubleValue) internalAsset:YES];
  }
  
  NSMutableDictionary *context = [NSMutableDictionary new];

  // Only apply custom scale factors when neccessary. The scale factor
  // affects how the image is rendered when resizeMode `center` and `repeat`
  // are used. On animated images, applying a scale factor may cause
  // re-encoding of the data, which should be avoided when possible.
  if (scale && scale.doubleValue != 1.0) {
    [context setValue:scale forKey:SDWebImageContextImageScaleFactor];
  }

  [self sd_setImageWithURL:imageURL
          placeholderImage:nil
                   options:SDWebImageAvoidAutoSetImage
                   context:context
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

    // Modifications to the image like changing the resizing-mode or cap-insets
    // cannot be handled using a SDWebImage transformer, because they don't change
    // the image-data and this causes this "meta" data to be lost in the SDWebImage caching process.
    if (image) {
      if (resizeMode == RCTResizeModeRepeat) {
        image = [image resizableImageWithCapInsets:UIEdgeInsetsZero resizingMode:UIImageResizingModeTile];
      }
    }
    
    // When no explicit source image size was specified, use the dimensions
    // of the loaded image as the intrinsic content size.
    if (!width && !height) {
      [self updateIntrinsicContentSize:image.size internalAsset:NO];
    }

    // Update image
    strongSelf.image = image;

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

# pragma mark -  Intrinsic content size

- (CGSize)intrinsicContentSize
{
  return _intrinsicContentSize;
}

- (void)updateIntrinsicContentSize:(CGSize)intrinsicContentSize internalAsset:(BOOL)internalAsset
{
  if (!CGSizeEqualToSize(_intrinsicContentSize, intrinsicContentSize)) {
    _intrinsicContentSize = intrinsicContentSize;
    
    // Only inform Yoga of the intrinsic image size when needed.
    // Yoga already knows about the size of the internal assets, and
    // only needs to be informed about the intrinsic content size when
    // no size styles were provided to the component. Always updating
    // the intrinsicContentSize will cause unnecessary layout passes
    // which we want to avoid.
    if (!internalAsset && CGRectIsEmpty(self.bounds)) {
      [_bridge.uiManager setIntrinsicContentSize:intrinsicContentSize forView:self];
    }
  }
}

@end
