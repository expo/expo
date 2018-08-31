/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTImageView.h"

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>
#import <ReactABI30_0_0/ABI30_0_0RCTEventDispatcher.h>
#import <ReactABI30_0_0/ABI30_0_0RCTImageSource.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUtils.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>

#import "ABI30_0_0RCTImageBlurUtils.h"
#import "ABI30_0_0RCTImageLoader.h"
#import "ABI30_0_0RCTImageUtils.h"

/**
 * Determines whether an image of `currentSize` should be reloaded for display
 * at `idealSize`.
 */
static BOOL ABI30_0_0RCTShouldReloadImageForSizeChange(CGSize currentSize, CGSize idealSize)
{
  static const CGFloat upscaleThreshold = 1.2;
  static const CGFloat downscaleThreshold = 0.5;

  CGFloat widthMultiplier = idealSize.width / currentSize.width;
  CGFloat heightMultiplier = idealSize.height / currentSize.height;

  return widthMultiplier > upscaleThreshold || widthMultiplier < downscaleThreshold ||
    heightMultiplier > upscaleThreshold || heightMultiplier < downscaleThreshold;
}

/**
 * See ABI30_0_0RCTConvert (ImageSource). We want to send down the source as a similar
 * JSON parameter.
 */
static NSDictionary *onLoadParamsForSource(ABI30_0_0RCTImageSource *source)
{
  NSDictionary *dict = @{
    @"width": @(source.size.width),
    @"height": @(source.size.height),
    @"url": source.request.URL.absoluteString,
  };
  return @{ @"source": dict };
}

@interface ABI30_0_0RCTImageView ()

@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onProgress;
@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onError;
@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onPartialLoad;
@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onLoad;
@property (nonatomic, copy) ABI30_0_0RCTDirectEventBlock onLoadEnd;

@end

@implementation ABI30_0_0RCTImageView
{
  // Weak reference back to the bridge, for image loading
  __weak ABI30_0_0RCTBridge *_bridge;

  // The image source that's currently displayed
  ABI30_0_0RCTImageSource *_imageSource;

  // The image source that's being loaded from the network
  ABI30_0_0RCTImageSource *_pendingImageSource;

  // Size of the image loaded / being loaded, so we can determine when to issue a reload to accommodate a changing size.
  CGSize _targetSize;

  // A block that can be invoked to cancel the most recent call to -reloadImage, if any
  ABI30_0_0RCTImageLoaderCancellationBlock _reloadImageCancellationBlock;

  // Whether the latest change of props requires the image to be reloaded
  BOOL _needsReload;
}

- (instancetype)initWithBridge:(ABI30_0_0RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidReceiveMemoryWarningNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateWithImage:(UIImage *)image
{
  if (!image) {
    super.image = nil;
    return;
  }

  // Apply rendering mode
  if (_renderingMode != image.renderingMode) {
    image = [image imageWithRenderingMode:_renderingMode];
  }

  if (_resizeMode == ABI30_0_0RCTResizeModeRepeat) {
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeTile];
  } else if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, _capInsets)) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeStretch];
  }

  // Apply trilinear filtering to smooth out mis-sized images
  self.layer.minificationFilter = kCAFilterTrilinear;
  self.layer.magnificationFilter = kCAFilterTrilinear;

  super.image = image;
}

- (void)setImage:(UIImage *)image
{
  image = image ?: _defaultImage;
  if (image != self.image) {
    [self updateWithImage:image];
  }
}

- (void)setBlurRadius:(CGFloat)blurRadius
{
  if (blurRadius != _blurRadius) {
    _blurRadius = blurRadius;
    _needsReload = YES;
  }
}

- (void)setCapInsets:(UIEdgeInsets)capInsets
{
  if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, capInsets)) {
    if (UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero) ||
        UIEdgeInsetsEqualToEdgeInsets(capInsets, UIEdgeInsetsZero)) {
      _capInsets = capInsets;
      // Need to reload image when enabling or disabling capInsets
      _needsReload = YES;
    } else {
      _capInsets = capInsets;
      [self updateWithImage:self.image];
    }
  }
}

- (void)setRenderingMode:(UIImageRenderingMode)renderingMode
{
  if (_renderingMode != renderingMode) {
    _renderingMode = renderingMode;
    [self updateWithImage:self.image];
  }
}

- (void)setImageSources:(NSArray<ABI30_0_0RCTImageSource *> *)imageSources
{
  if (![imageSources isEqual:_imageSources]) {
    _imageSources = [imageSources copy];
    _needsReload = YES;
  }
}

- (void)setResizeMode:(ABI30_0_0RCTResizeMode)resizeMode
{
  if (_resizeMode != resizeMode) {
    _resizeMode = resizeMode;

    if (_resizeMode == ABI30_0_0RCTResizeModeRepeat) {
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      self.contentMode = UIViewContentModeScaleToFill;
    } else {
      self.contentMode = (UIViewContentMode)resizeMode;
    }

    if ([self shouldReloadImageSourceAfterResize]) {
      _needsReload = YES;
    }
  }
}

- (void)cancelImageLoad
{
  ABI30_0_0RCTImageLoaderCancellationBlock previousCancellationBlock = _reloadImageCancellationBlock;
  if (previousCancellationBlock) {
    previousCancellationBlock();
    _reloadImageCancellationBlock = nil;
  }

  _pendingImageSource = nil;
}

- (void)clearImage
{
  [self cancelImageLoad];
  [self.layer removeAnimationForKey:@"contents"];
  self.image = nil;
  _imageSource = nil;
}

- (void)clearImageIfDetached
{
  if (!self.window) {
    [self clearImage];
  }
}

- (BOOL)hasMultipleSources
{
  return _imageSources.count > 1;
}

- (ABI30_0_0RCTImageSource *)imageSourceForSize:(CGSize)size
{
  if (![self hasMultipleSources]) {
    return _imageSources.firstObject;
  }

  // Need to wait for layout pass before deciding.
  if (CGSizeEqualToSize(size, CGSizeZero)) {
    return nil;
  }

  const CGFloat scale = ABI30_0_0RCTScreenScale();
  const CGFloat targetImagePixels = size.width * size.height * scale * scale;

  ABI30_0_0RCTImageSource *bestSource = nil;
  CGFloat bestFit = CGFLOAT_MAX;
  for (ABI30_0_0RCTImageSource *source in _imageSources) {
    CGSize imgSize = source.size;
    const CGFloat imagePixels =
      imgSize.width * imgSize.height * source.scale * source.scale;
    const CGFloat fit = ABS(1 - (imagePixels / targetImagePixels));

    if (fit < bestFit) {
      bestFit = fit;
      bestSource = source;
    }
  }
  return bestSource;
}

- (BOOL)shouldReloadImageSourceAfterResize
{
  // If capInsets are set, image doesn't need reloading when resized
  return UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero);
}

- (BOOL)shouldChangeImageSource
{
  // We need to reload if the desired image source is different from the current image
  // source AND the image load that's pending
  ABI30_0_0RCTImageSource *desiredImageSource = [self imageSourceForSize:self.frame.size];
  return ![desiredImageSource isEqual:_imageSource] &&
         ![desiredImageSource isEqual:_pendingImageSource];
}

- (void)reloadImage
{
  [self cancelImageLoad];
  _needsReload = NO;

  ABI30_0_0RCTImageSource *source = [self imageSourceForSize:self.frame.size];
  _pendingImageSource = source;

  if (source && self.frame.size.width > 0 && self.frame.size.height > 0) {
    if (_onLoadStart) {
      _onLoadStart(nil);
    }

    ABI30_0_0RCTImageLoaderProgressBlock progressHandler = nil;
    if (_onProgress) {
      progressHandler = ^(int64_t loaded, int64_t total) {
        self->_onProgress(@{
          @"loaded": @((double)loaded),
          @"total": @((double)total),
        });
      };
    }

    __weak ABI30_0_0RCTImageView *weakSelf = self;
    ABI30_0_0RCTImageLoaderPartialLoadBlock partialLoadHandler = ^(UIImage *image) {
      [weakSelf imageLoaderLoadedImage:image error:nil forImageSource:source partial:YES];
    };

    CGSize imageSize = self.bounds.size;
    CGFloat imageScale = ABI30_0_0RCTScreenScale();
    if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero)) {
      // Don't resize images that use capInsets
      imageSize = CGSizeZero;
      imageScale = source.scale;
    }

    ABI30_0_0RCTImageLoaderCompletionBlock completionHandler = ^(NSError *error, UIImage *loadedImage) {
      [weakSelf imageLoaderLoadedImage:loadedImage error:error forImageSource:source partial:NO];
    };

    _reloadImageCancellationBlock =
    [_bridge.imageLoader loadImageWithURLRequest:source.request
                                            size:imageSize
                                           scale:imageScale
                                         clipped:NO
                                      resizeMode:_resizeMode
                                   progressBlock:progressHandler
                                partialLoadBlock:partialLoadHandler
                                 completionBlock:completionHandler];
  } else {
    [self clearImage];
  }
}

- (void)imageLoaderLoadedImage:(UIImage *)loadedImage error:(NSError *)error forImageSource:(ABI30_0_0RCTImageSource *)source partial:(BOOL)isPartialLoad
{
  if (![source isEqual:_pendingImageSource]) {
    // Bail out if source has changed since we started loading
    return;
  }

  if (error) {
    if (_onError) {
      _onError(@{ @"error": error.localizedDescription });
    }
    if (_onLoadEnd) {
      _onLoadEnd(nil);
    }
    return;
  }

  void (^setImageBlock)(UIImage *) = ^(UIImage *image) {
    if (!isPartialLoad) {
      self->_imageSource = source;
      self->_pendingImageSource = nil;
    }

    if (image.ReactABI30_0_0KeyframeAnimation) {
      [self.layer addAnimation:image.ReactABI30_0_0KeyframeAnimation forKey:@"contents"];
    } else {
      [self.layer removeAnimationForKey:@"contents"];
      self.image = image;
    }

    if (isPartialLoad) {
      if (self->_onPartialLoad) {
        self->_onPartialLoad(nil);
      }
    } else {
      if (self->_onLoad) {
        ABI30_0_0RCTImageSource *sourceLoaded = [source imageSourceWithSize:image.size scale:source.scale];
        self->_onLoad(onLoadParamsForSource(sourceLoaded));
      }
      if (self->_onLoadEnd) {
        self->_onLoadEnd(nil);
      }
    }
  };

  if (_blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = ABI30_0_0RCTBlurredImageWithRadius(loadedImage, self->_blurRadius);
      ABI30_0_0RCTExecuteOnMainQueue(^{
        setImageBlock(blurredImage);
      });
    });
  } else {
    // No blur, so try to set the image on the main thread synchronously to minimize image
    // flashing. (For instance, if this view gets attached to a window, then -didMoveToWindow
    // calls -reloadImage, and we want to set the image synchronously if possible so that the
    // image property is set in the same CATransaction that attaches this view to the window.)
    ABI30_0_0RCTExecuteOnMainQueue(^{
      setImageBlock(loadedImage);
    });
  }
}

- (void)ReactABI30_0_0SetFrame:(CGRect)frame
{
  [super ReactABI30_0_0SetFrame:frame];

  // If we didn't load an image yet, or the new frame triggers a different image source
  // to be loaded, reload to swap to the proper image source.
  if ([self shouldChangeImageSource]) {
    _targetSize = frame.size;
    [self reloadImage];
  } else if ([self shouldReloadImageSourceAfterResize]) {
    CGSize imageSize = self.image.size;
    CGFloat imageScale = self.image.scale;
    CGSize idealSize = ABI30_0_0RCTTargetSize(imageSize, imageScale, frame.size, ABI30_0_0RCTScreenScale(),
                                     (ABI30_0_0RCTResizeMode)self.contentMode, YES);

    // Don't reload if the current image or target image size is close enough
    if (!ABI30_0_0RCTShouldReloadImageForSizeChange(imageSize, idealSize) ||
        !ABI30_0_0RCTShouldReloadImageForSizeChange(_targetSize, idealSize)) {
      return;
    }

    // Don't reload if the current image size is the maximum size of the image source
    CGSize imageSourceSize = _imageSource.size;
    if (imageSize.width * imageScale == imageSourceSize.width * _imageSource.scale &&
        imageSize.height * imageScale == imageSourceSize.height * _imageSource.scale) {
      return;
    }

    ABI30_0_0RCTLogInfo(@"Reloading image %@ as size %@", _imageSource.request.URL.absoluteString, NSStringFromCGSize(idealSize));

    // If the existing image or an image being loaded are not the right
    // size, reload the asset in case there is a better size available.
    _targetSize = idealSize;
    [self reloadImage];
  }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if (_needsReload) {
    [self reloadImage];
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (!self.window) {
    // Cancel loading the image if we've moved offscreen. In addition to helping
    // prioritise image requests that are actually on-screen, this removes
    // requests that have gotten "stuck" from the queue, unblocking other images
    // from loading.
    [self cancelImageLoad];
  } else if ([self shouldChangeImageSource]) {
    [self reloadImage];
  }
}

@end
