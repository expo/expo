//
//  LOTLayerContainer.m
//  Lottie
//
//  Created by brandon_withrow on 7/18/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTLayerContainer.h"
#import "LOTTransformInterpolator.h"
#import "LOTNumberInterpolator.h"
#import "CGGeometry+LOTAdditions.h"
#import "LOTRenderGroup.h"
#import "LOTHelpers.h"
#import "LOTMaskContainer.h"
#import "LOTAsset.h"

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR
#import "LOTCacheProvider.h"
#endif

@implementation LOTLayerContainer {
  LOTTransformInterpolator *_transformInterpolator;
  LOTNumberInterpolator *_opacityInterpolator;
  NSNumber *_inFrame;
  NSNumber *_outFrame;
  CALayer *DEBUG_Center;
  LOTRenderGroup *_contentsGroup;
  LOTMaskContainer *_maskLayer;
}

@dynamic currentFrame;

- (instancetype)initWithModel:(LOTLayer *)layer
                 inLayerGroup:(LOTLayerGroup *)layerGroup {
  self = [super init];
  if (self) {
    _wrapperLayer = [CALayer new];
    [self addSublayer:_wrapperLayer];
    DEBUG_Center = [CALayer layer];
    
    DEBUG_Center.bounds = CGRectMake(0, 0, 20, 20);
    DEBUG_Center.borderColor = [UIColor blueColor].CGColor;
    DEBUG_Center.borderWidth = 2;
    DEBUG_Center.masksToBounds = YES;
    
    if (ENABLE_DEBUG_SHAPES) {
      [_wrapperLayer addSublayer:DEBUG_Center];
    } 
    self.actions = @{@"hidden" : [NSNull null], @"opacity" : [NSNull null], @"transform" : [NSNull null]};
    _wrapperLayer.actions = [self.actions copy];
    _timeStretchFactor = @1;
    [self commonInitializeWith:layer inLayerGroup:layerGroup];
  }
  return self;
}

- (void)commonInitializeWith:(LOTLayer *)layer
                inLayerGroup:(LOTLayerGroup *)layerGroup {
  if (layer == nil) {
    return;
  }
  _layerName = layer.layerName;
  if (layer.layerType == LOTLayerTypeImage ||
      layer.layerType == LOTLayerTypeSolid ||
      layer.layerType == LOTLayerTypePrecomp) {
    _wrapperLayer.bounds = CGRectMake(0, 0, layer.layerWidth.floatValue, layer.layerHeight.floatValue);
    _wrapperLayer.anchorPoint = CGPointMake(0, 0);
    _wrapperLayer.masksToBounds = YES;
    DEBUG_Center.position = LOT_RectGetCenterPoint(self.bounds);
  }
  
  if (layer.layerType == LOTLayerTypeImage) {
    [self _setImageForAsset:layer.imageAsset];
  }
  
  _inFrame = [layer.inFrame copy];
  _outFrame = [layer.outFrame copy];

  _timeStretchFactor = [layer.timeStretch copy];
  _transformInterpolator = [LOTTransformInterpolator transformForLayer:layer];

  if (layer.parentID != nil) {
    NSNumber *parentID = layer.parentID;
    LOTTransformInterpolator *childInterpolator = _transformInterpolator;
    while (parentID != nil) {
      LOTLayer *parentModel = [layerGroup layerModelForID:parentID];
      LOTTransformInterpolator *interpolator = [LOTTransformInterpolator transformForLayer:parentModel];
      childInterpolator.inputNode = interpolator;
      childInterpolator = interpolator;
      parentID = parentModel.parentID;
    }
  }
  _opacityInterpolator = [[LOTNumberInterpolator alloc] initWithKeyframes:layer.opacity.keyframes];
  if (layer.layerType == LOTLayerTypeShape &&
      layer.shapes.count) {
    [self buildContents:layer.shapes];
  }
  if (layer.layerType == LOTLayerTypeSolid) {
    _wrapperLayer.backgroundColor = layer.solidColor.CGColor;
  }
  if (layer.masks.count) {
    _maskLayer = [[LOTMaskContainer alloc] initWithMasks:layer.masks];
    _wrapperLayer.mask = _maskLayer;
  }
  
  NSMutableDictionary *interpolators = [NSMutableDictionary dictionary];
  interpolators[@"Opacity"] = _opacityInterpolator;
  interpolators[@"Anchor Point"] = _transformInterpolator.anchorInterpolator;
  interpolators[@"Scale"] = _transformInterpolator.scaleInterpolator;
  interpolators[@"Rotation"] = _transformInterpolator.rotationInterpolator;
  if (_transformInterpolator.positionXInterpolator &&
      _transformInterpolator.positionYInterpolator) {
    interpolators[@"X Position"] = _transformInterpolator.positionXInterpolator;
    interpolators[@"Y Position"] = _transformInterpolator.positionYInterpolator;
  } else if (_transformInterpolator.positionInterpolator) {
    interpolators[@"Position"] = _transformInterpolator.positionInterpolator;
  }

  // Deprecated
  interpolators[@"Transform.Opacity"] = _opacityInterpolator;
  interpolators[@"Transform.Anchor Point"] = _transformInterpolator.anchorInterpolator;
  interpolators[@"Transform.Scale"] = _transformInterpolator.scaleInterpolator;
  interpolators[@"Transform.Rotation"] = _transformInterpolator.rotationInterpolator;
  if (_transformInterpolator.positionXInterpolator &&
      _transformInterpolator.positionYInterpolator) {
    interpolators[@"Transform.X Position"] = _transformInterpolator.positionXInterpolator;
    interpolators[@"Transform.Y Position"] = _transformInterpolator.positionYInterpolator;
  } else if (_transformInterpolator.positionInterpolator) {
    interpolators[@"Transform.Position"] = _transformInterpolator.positionInterpolator;
  }
  _valueInterpolators = interpolators;
}

- (void)buildContents:(NSArray *)contents {
  _contentsGroup = [[LOTRenderGroup alloc] initWithInputNode:nil contents:contents keyname:_layerName];
  [_wrapperLayer addSublayer:_contentsGroup.containerLayer];
}

#if TARGET_OS_IPHONE || TARGET_OS_SIMULATOR

- (void)_setImageForAsset:(LOTAsset *)asset {
  if (asset.imageName) {
    UIImage *image;
    if ([asset.imageName hasPrefix:@"data:"]) {
      // Contents look like a data: URL. Ignore asset.imageDirectory and simply load the image directly.
      NSURL *imageUrl = [NSURL URLWithString:asset.imageName];
      NSData *imageData = [NSData dataWithContentsOfURL:imageUrl];
      image = [UIImage imageWithData:imageData];
    } else if (asset.rootDirectory.length > 0) {
      NSString *rootDirectory  = asset.rootDirectory;
      if (asset.imageDirectory.length > 0) {
        rootDirectory = [rootDirectory stringByAppendingPathComponent:asset.imageDirectory];
      }
      NSString *imagePath = [rootDirectory stringByAppendingPathComponent:asset.imageName];
        
      id<LOTImageCache> imageCache = [LOTCacheProvider imageCache];
      if (imageCache) {
        image = [imageCache imageForKey:imagePath];
        if (!image) {
          image = [UIImage imageWithContentsOfFile:imagePath];
          [imageCache setImage:image forKey:imagePath];
        }
      } else {
        image = [UIImage imageWithContentsOfFile:imagePath];
      }
    } else {
        NSString *imagePath = [asset.assetBundle pathForResource:asset.imageName ofType:nil];
        image = [UIImage imageWithContentsOfFile:imagePath];
    }

    //try loading from asset catalogue instead if all else fails
    if (!image) {
      image = [UIImage imageNamed:asset.imageName inBundle: asset.assetBundle compatibleWithTraitCollection:nil];
    }
    
    if (image) {
      _wrapperLayer.contents = (__bridge id _Nullable)(image.CGImage);
    } else {
      NSLog(@"%s: Warn: image not found: %@", __PRETTY_FUNCTION__, asset.imageName);
    }
  }
}

#else

- (void)_setImageForAsset:(LOTAsset *)asset {
  if (asset.imageName) {
    NSArray *components = [asset.imageName componentsSeparatedByString:@"."];
    NSImage *image = [NSImage imageNamed:components.firstObject];
    if (image == nil) {
      if (asset.rootDirectory.length > 0 && asset.imageDirectory.length > 0) {
        NSString *imagePath = [[asset.rootDirectory stringByAppendingPathComponent:asset.imageDirectory] stringByAppendingPathComponent:asset.imageName];
        image = [[NSImage alloc] initWithContentsOfFile:imagePath];
      }
    }
    if (image) {
      NSWindow *window = [NSApp mainWindow];
      CGFloat desiredScaleFactor = [window backingScaleFactor];
      CGFloat actualScaleFactor = [image recommendedLayerContentsScale:desiredScaleFactor];
      id layerContents = [image layerContentsForContentsScale:actualScaleFactor];
      _wrapperLayer.contents = layerContents;
    }
  }
  
}

#endif

// MARK - Animation

+ (BOOL)needsDisplayForKey:(NSString *)key {
  if ([key isEqualToString:@"currentFrame"]) {
    return YES;
  }
  return [super needsDisplayForKey:key];
}

- (id<CAAction>)actionForKey:(NSString *)event {
  if ([event isEqualToString:@"currentFrame"]) {
    CABasicAnimation *theAnimation = [CABasicAnimation
                                      animationWithKeyPath:event];
    theAnimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    theAnimation.fromValue = [[self presentationLayer] valueForKey:event];
    return theAnimation;
  }
  return [super actionForKey:event];
}

- (id)initWithLayer:(id)layer {
  if (self = [super initWithLayer:layer]) {
    if ([layer isKindOfClass:[LOTLayerContainer class]]) {
      LOTLayerContainer *other = (LOTLayerContainer *)layer;
      self.currentFrame = [other.currentFrame copy];
    }
  }
  return self;
}

- (void)display {
  @synchronized(self) {
    LOTLayerContainer *presentation = self;
    if (self.animationKeys.count &&
      self.presentationLayer) {
        presentation = (LOTLayerContainer *)self.presentationLayer;
    }
    [self displayWithFrame:presentation.currentFrame];
  }
}

- (void)displayWithFrame:(NSNumber *)frame {
  [self displayWithFrame:frame forceUpdate:NO];
}

- (void)displayWithFrame:(NSNumber *)frame forceUpdate:(BOOL)forceUpdate {
  NSNumber *newFrame = @(frame.floatValue / self.timeStretchFactor.floatValue);
  if (ENABLE_DEBUG_LOGGING) NSLog(@"View %@ Displaying Frame %@, with local time %@", self, frame, newFrame);
  BOOL hidden = NO;
  if (_inFrame && _outFrame) {
    hidden = (frame.floatValue < _inFrame.floatValue ||
              frame.floatValue > _outFrame.floatValue);
  }
  self.hidden = hidden;
  if (hidden) {
    return;
  }
  if (_opacityInterpolator && [_opacityInterpolator hasUpdateForFrame:newFrame]) {
    self.opacity = [_opacityInterpolator floatValueForFrame:newFrame];
  }
  if (_transformInterpolator && [_transformInterpolator hasUpdateForFrame:newFrame]) {
    _wrapperLayer.transform = [_transformInterpolator transformForFrame:newFrame];
  }
  [_contentsGroup updateWithFrame:newFrame withModifierBlock:nil forceLocalUpdate:forceUpdate];
  _maskLayer.currentFrame = newFrame;
}

- (void)setViewportBounds:(CGRect)viewportBounds {
  _viewportBounds = viewportBounds;
  if (_maskLayer) {
    CGPoint center = LOT_RectGetCenterPoint(viewportBounds);
    viewportBounds.origin = CGPointMake(-center.x, -center.y);
    _maskLayer.bounds = viewportBounds;
  }
}

- (void)searchNodesForKeypath:(LOTKeypath * _Nonnull)keypath {
  if (_contentsGroup == nil && [keypath pushKey:self.layerName]) {
    // Matches self.
    if ([keypath pushKey:@"Transform"]) {
      // Is a transform node, check interpolators
      LOTValueInterpolator *interpolator = _valueInterpolators[keypath.currentKey];
      if (interpolator) {
        // We have a match!
        [keypath pushKey:keypath.currentKey];
        [keypath addSearchResultForCurrentPath:_wrapperLayer];
        [keypath popKey];
      }
      if (keypath.endOfKeypath) {
        [keypath addSearchResultForCurrentPath:_wrapperLayer];
      }
      [keypath popKey];
    }
    if (keypath.endOfKeypath) {
      [keypath addSearchResultForCurrentPath:_wrapperLayer];
    }
    [keypath popKey];
  }
  [_contentsGroup searchNodesForKeypath:keypath];
}

- (void)setValueDelegate:(id<LOTValueDelegate> _Nonnull)delegate
              forKeypath:(LOTKeypath * _Nonnull)keypath {
  if ([keypath pushKey:self.layerName]) {
    // Matches self.
    if ([keypath pushKey:@"Transform"]) {
      // Is a transform node, check interpolators
      LOTValueInterpolator *interpolator = _valueInterpolators[keypath.currentKey];
      if (interpolator) {
        // We have a match!
        [interpolator setValueDelegate:delegate];
      }
      [keypath popKey];
    }
    [keypath popKey];
  }
  [_contentsGroup setValueDelegate:delegate forKeypath:keypath];
}

@end
