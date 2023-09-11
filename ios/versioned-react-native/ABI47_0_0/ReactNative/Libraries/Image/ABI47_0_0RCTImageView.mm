/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTImageView.h>

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTImageBlurUtils.h>
#import <ABI47_0_0React/ABI47_0_0RCTImageSource.h>
#import <ABI47_0_0React/ABI47_0_0RCTImageUtils.h>
#import <ABI47_0_0React/ABI47_0_0RCTImageLoaderWithAttributionProtocol.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIImageViewAnimated.h>
#import <ABI47_0_0React/ABI47_0_0RCTUtils.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>

/**
 * Determines whether an image of `currentSize` should be reloaded for display
 * at `idealSize`.
 */
static BOOL ABI47_0_0RCTShouldReloadImageForSizeChange(CGSize currentSize, CGSize idealSize)
{
  static const CGFloat upscaleThreshold = 1.2;
  static const CGFloat downscaleThreshold = 0.5;

  CGFloat widthMultiplier = idealSize.width / currentSize.width;
  CGFloat heightMultiplier = idealSize.height / currentSize.height;

  return widthMultiplier > upscaleThreshold || widthMultiplier < downscaleThreshold ||
    heightMultiplier > upscaleThreshold || heightMultiplier < downscaleThreshold;
}

/**
 * See ABI47_0_0RCTConvert (ImageSource). We want to send down the source as a similar
 * JSON parameter.
 */
static NSDictionary *onLoadParamsForSource(ABI47_0_0RCTImageSource *source)
{
  NSDictionary *dict = @{
    @"uri": source.request.URL.absoluteString,
    @"width": @(source.size.width),
    @"height": @(source.size.height),
  };
  return @{ @"source": dict };
}

@interface ABI47_0_0RCTImageView ()

@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onLoadStart;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onProgress;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onError;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onPartialLoad;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onLoad;
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onLoadEnd;

@end

@implementation ABI47_0_0RCTImageView
{
  // Weak reference back to the bridge, for image loading
  __weak ABI47_0_0RCTBridge *_bridge;

  // Weak reference back to the active image loader.
  __weak id<ABI47_0_0RCTImageLoaderWithAttributionProtocol> _imageLoader;

  // The image source that's currently displayed
  ABI47_0_0RCTImageSource *_imageSource;

  // The image source that's being loaded from the network
  ABI47_0_0RCTImageSource *_pendingImageSource;

  // Size of the image loaded / being loaded, so we can determine when to issue a reload to accommodate a changing size.
  CGSize _targetSize;

  // Whether the latest change of props requires the image to be reloaded
  BOOL _needsReload;

  ABI47_0_0RCTUIImageViewAnimated *_imageView;

  ABI47_0_0RCTImageURLLoaderRequest *_loaderRequest;
}

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _imageView = [ABI47_0_0RCTUIImageViewAnimated new];
    _imageView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    [self addSubview:_imageView];

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidReceiveMemoryWarningNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(clearImageIfDetached)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    if (@available(iOS 13.0, *)) {
      [center addObserver:self
                 selector:@selector(clearImageIfDetached)

                     name:UISceneDidEnterBackgroundNotification
                   object:nil];
    }
#endif
  }
  return self;
}

ABI47_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

ABI47_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

ABI47_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)

- (void)updateWithImage:(UIImage *)image
{
  if (!image) {
    _imageView.image = nil;
    return;
  }

  // Apply rendering mode
  if (_renderingMode != image.renderingMode) {
    image = [image imageWithRenderingMode:_renderingMode];
  }

  if (_resizeMode == ABI47_0_0RCTResizeModeRepeat) {
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeTile];
  } else if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, _capInsets)) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeStretch];
  }

  // Apply trilinear filtering to smooth out mis-sized images
  _imageView.layer.minificationFilter = kCAFilterTrilinear;
  _imageView.layer.magnificationFilter = kCAFilterTrilinear;

  _imageView.image = image;
}

- (void)setImage:(UIImage *)image
{
  image = image ?: _defaultImage;
  if (image != self.image) {
    [self updateWithImage:image];
  }
}

- (UIImage *)image {
  return _imageView.image;
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

- (void)setImageSources:(NSArray<ABI47_0_0RCTImageSource *> *)imageSources
{
  if (![imageSources isEqual:_imageSources]) {
    _imageSources = [imageSources copy];
    _needsReload = YES;
  }
}

- (void)setResizeMode:(ABI47_0_0RCTResizeMode)resizeMode
{
  if (_resizeMode != resizeMode) {
    _resizeMode = resizeMode;

    if (_resizeMode == ABI47_0_0RCTResizeModeRepeat) {
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      _imageView.contentMode = UIViewContentModeScaleToFill;
    } else {
      _imageView.contentMode = (UIViewContentMode)resizeMode;
    }

    if ([self shouldReloadImageSourceAfterResize]) {
      _needsReload = YES;
    }
  }
}

- (void)setInternal_analyticTag:(NSString *)internal_analyticTag {
    if (_internal_analyticTag != internal_analyticTag) {
        _internal_analyticTag = internal_analyticTag;
        _needsReload = YES;
    }
}

- (void)cancelImageLoad
{
  [_loaderRequest cancel];
  _pendingImageSource = nil;
}

- (void)cancelAndClearImageLoad
{
  [self cancelImageLoad];

  [_imageLoader trackURLImageRequestDidDestroy:_loaderRequest];
  _loaderRequest = nil;

  if (!self.image) {
    self.image = _defaultImage;
  }
}

- (void)clearImageIfDetached
{
  if (!self.window) {
    [self cancelAndClearImageLoad];
    self.image = nil;
    _imageSource = nil;
  }
}

- (BOOL)hasMultipleSources
{
  return _imageSources.count > 1;
}

- (ABI47_0_0RCTImageSource *)imageSourceForSize:(CGSize)size
{
  if (![self hasMultipleSources]) {
    return _imageSources.firstObject;
  }

  // Need to wait for layout pass before deciding.
  if (CGSizeEqualToSize(size, CGSizeZero)) {
    return nil;
  }

  const CGFloat scale = ABI47_0_0RCTScreenScale();
  const CGFloat targetImagePixels = size.width * size.height * scale * scale;

  ABI47_0_0RCTImageSource *bestSource = nil;
  CGFloat bestFit = CGFLOAT_MAX;
  for (ABI47_0_0RCTImageSource *source in _imageSources) {
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
  ABI47_0_0RCTImageSource *desiredImageSource = [self imageSourceForSize:self.frame.size];
  return ![desiredImageSource isEqual:_imageSource] &&
         ![desiredImageSource isEqual:_pendingImageSource];
}

- (void)reloadImage
{
  [self cancelAndClearImageLoad];
  _needsReload = NO;

  ABI47_0_0RCTImageSource *source = [self imageSourceForSize:self.frame.size];
  _pendingImageSource = source;

  if (source && self.frame.size.width > 0 && self.frame.size.height > 0) {
    if (_onLoadStart) {
      _onLoadStart(nil);
    }

    ABI47_0_0RCTImageLoaderProgressBlock progressHandler = nil;
    if (self.onProgress) {
      ABI47_0_0RCTDirectEventBlock onProgress = self.onProgress;
      progressHandler = ^(int64_t loaded, int64_t total) {
        onProgress(@{
          @"loaded": @((double)loaded),
          @"total": @((double)total),
        });
      };
    }

    __weak ABI47_0_0RCTImageView *weakSelf = self;
    ABI47_0_0RCTImageLoaderPartialLoadBlock partialLoadHandler = ^(UIImage *image) {
      [weakSelf imageLoaderLoadedImage:image error:nil forImageSource:source partial:YES];
    };

    CGSize imageSize = self.bounds.size;
    CGFloat imageScale = ABI47_0_0RCTScreenScale();
    if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, UIEdgeInsetsZero)) {
      // Don't resize images that use capInsets
      imageSize = CGSizeZero;
      imageScale = source.scale;
    }

    ABI47_0_0RCTImageLoaderCompletionBlockWithMetadata completionHandler = ^(NSError *error, UIImage *loadedImage, id metadata) {
      [weakSelf imageLoaderLoadedImage:loadedImage error:error forImageSource:source partial:NO];
    };

    if (!_imageLoader) {
      _imageLoader = [_bridge moduleForName:@"ImageLoader" lazilyLoadIfNecessary:YES];
    }

    ABI47_0_0RCTImageURLLoaderRequest *loaderRequest = [_imageLoader loadImageWithURLRequest:source.request
                                                                               size:imageSize
                                                                              scale:imageScale
                                                                           clipped:NO
                                                                        resizeMode:_resizeMode
                                                                          priority:ABI47_0_0RCTImageLoaderPriorityImmediate
                                                                       attribution:{
                                                                                   .nativeViewTag = [self.ABI47_0_0ReactTag intValue],
                                                                                   .surfaceId = [self.rootTag intValue],
                                                                                   .analyticTag = self.internal_analyticTag
                                                                                   }
                                                                     progressBlock:progressHandler
                                                                  partialLoadBlock:partialLoadHandler
                                                                   completionBlock:completionHandler];
    _loaderRequest = loaderRequest;
  } else {
    [self cancelAndClearImageLoad];
  }
}

- (void)imageLoaderLoadedImage:(UIImage *)loadedImage error:(NSError *)error forImageSource:(ABI47_0_0RCTImageSource *)source partial:(BOOL)isPartialLoad
{
  if (![source isEqual:_pendingImageSource]) {
    // Bail out if source has changed since we started loading
    return;
  }

  if (error) {
    __weak ABI47_0_0RCTImageView *weakSelf = self;
    ABI47_0_0RCTExecuteOnMainQueue(^{
      weakSelf.image = nil;
    });

    if (_onError) {
      _onError(@{ @"error": error.localizedDescription, @"responseCode": (error.userInfo[@"httpStatusCode"]?: [NSNull null]), @"httpResponseHeaders": (error.userInfo[@"httpResponseHeaders"] ?: [NSNull null]) });
    }
    if (_onLoadEnd) {
      _onLoadEnd(nil);
    }
    return;
  }

  __weak ABI47_0_0RCTImageView *weakSelf = self;
  void (^setImageBlock)(UIImage *) = ^(UIImage *image) {
    ABI47_0_0RCTImageView *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    if (!isPartialLoad) {
      strongSelf->_imageSource = source;
      strongSelf->_pendingImageSource = nil;
    }

    strongSelf.image = image;

    if (isPartialLoad) {
      if (strongSelf->_onPartialLoad) {
        strongSelf->_onPartialLoad(nil);
      }
    } else {
      if (strongSelf->_onLoad) {
        ABI47_0_0RCTImageSource *sourceLoaded = [source imageSourceWithSize:image.size scale:source.scale];
        strongSelf->_onLoad(onLoadParamsForSource(sourceLoaded));
      }
      if (strongSelf->_onLoadEnd) {
        strongSelf->_onLoadEnd(nil);
      }
    }
  };

  if (_blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction
    CGFloat blurRadius = self.blurRadius;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = ABI47_0_0RCTBlurredImageWithRadius(loadedImage, blurRadius);
      ABI47_0_0RCTExecuteOnMainQueue(^{
        setImageBlock(blurredImage);
      });
    });
  } else {
    // No blur, so try to set the image on the main thread synchronously to minimize image
    // flashing. (For instance, if this view gets attached to a window, then -didMoveToWindow
    // calls -reloadImage, and we want to set the image synchronously if possible so that the
    // image property is set in the same CATransaction that attaches this view to the window.)
    ABI47_0_0RCTExecuteOnMainQueue(^{
      setImageBlock(loadedImage);
    });
  }
}

- (void)ABI47_0_0ReactSetFrame:(CGRect)frame
{
  [super ABI47_0_0ReactSetFrame:frame];

  // If we didn't load an image yet, or the new frame triggers a different image source
  // to be loaded, reload to swap to the proper image source.
  if ([self shouldChangeImageSource]) {
    _targetSize = frame.size;
    [self reloadImage];
  } else if ([self shouldReloadImageSourceAfterResize]) {
    CGSize imageSize = self.image.size;
    CGFloat imageScale = self.image.scale;
    CGSize idealSize = ABI47_0_0RCTTargetSize(imageSize, imageScale, frame.size, ABI47_0_0RCTScreenScale(),
                                     (ABI47_0_0RCTResizeMode)self.contentMode, YES);

    // Don't reload if the current image or target image size is close enough
    if (!ABI47_0_0RCTShouldReloadImageForSizeChange(imageSize, idealSize) ||
        !ABI47_0_0RCTShouldReloadImageForSizeChange(_targetSize, idealSize)) {
      return;
    }

    // Don't reload if the current image size is the maximum size of either the pending image source or image source
    CGSize imageSourceSize = (_imageSource ? _imageSource : _pendingImageSource).size;
    if (imageSize.width * imageScale == imageSourceSize.width * _imageSource.scale &&
        imageSize.height * imageScale == imageSourceSize.height * _imageSource.scale) {
      return;
    }

    ABI47_0_0RCTLogInfo(@"Reloading image %@ as size %@", _imageSource.request.URL.absoluteString, NSStringFromCGSize(idealSize));

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
    // Do not clear _loaderRequest because this component can be visible again without changing image source
    [self cancelImageLoad];
  } else if ([self shouldChangeImageSource]) {
    [self reloadImage];
  }
}

- (void)dealloc {
  [_imageLoader trackURLImageDidDestroy:_loaderRequest];
}

@end
