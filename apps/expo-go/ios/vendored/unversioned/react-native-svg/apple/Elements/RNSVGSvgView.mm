/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGSvgView.h"
#import <React/RCTLog.h>
#import "RNSVGNode.h"
#import "RNSVGViewBox.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTConversions.h>
#import <React/RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "RNSVGFabricConversions.h"
#endif // RCT_NEW_ARCH_ENABLED

@implementation RNSVGSvgView {
  NSMutableDictionary<NSString *, RNSVGNode *> *_clipPaths;
  NSMutableDictionary<NSString *, RNSVGNode *> *_templates;
  NSMutableDictionary<NSString *, RNSVGPainter *> *_painters;
  NSMutableDictionary<NSString *, RNSVGNode *> *_markers;
  NSMutableDictionary<NSString *, RNSVGNode *> *_masks;
  CGAffineTransform _invviewBoxTransform;
  bool rendered;
}

#ifdef RCT_NEW_ARCH_ENABLED
using namespace facebook::react;
#endif // RCT_NEW_ARCH_ENABLED

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
#if !TARGET_OS_OSX // Not available on macOS
    // This is necessary to ensure that [self setNeedsDisplay] actually triggers
    // a redraw when our parent transitions between hidden and visible.
    self.contentMode = UIViewContentModeRedraw;
#endif // TARGET_OS_OSX
    rendered = false;
#ifdef RCT_NEW_ARCH_ENABLED
    static const auto defaultProps = std::make_shared<const RNSVGSvgViewProps>();
    _props = defaultProps;
#if !TARGET_OS_OSX // On macOS, views are transparent by default
    // TODO: think if we can do it better
    self.opaque = NO;
#endif // TARGET_OS_OSX
#endif // RCT_NEW_ARCH_ENABLED
  }
  return self;
}

#ifdef RCT_NEW_ARCH_ENABLED
#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNSVGSvgViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = static_cast<const RNSVGSvgViewProps &>(*props);

  self.minX = newProps.minX;
  self.minY = newProps.minY;
  self.vbWidth = newProps.vbWidth;
  self.vbHeight = newProps.vbHeight;
  self.bbWidth = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.bbWidth)];
  self.bbHeight = [RNSVGLength lengthWithString:RCTNSStringFromString(newProps.bbHeight)];
  self.align = RCTNSStringFromStringNilIfEmpty(newProps.align);
  self.meetOrSlice = intToRNSVGVBMOS(newProps.meetOrSlice);
  if (RCTUIColorFromSharedColor(newProps.tintColor)) {
    self.tintColor = RCTUIColorFromSharedColor(newProps.tintColor);
  }
  if (RCTUIColorFromSharedColor(newProps.color)) {
    self.tintColor = RCTUIColorFromSharedColor(newProps.color);
  }
  [super updateProps:props oldProps:oldProps];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _minX = 0;
  _minY = 0;
  _vbWidth = 0;
  _vbHeight = 0;
  _bbWidth = 0;
  _bbHeight = 0;
  _align = nil;
  _meetOrSlice = kRNSVGVBMOSMeet;

  _responsible = NO;
  _active = NO;
  _boundingBox = CGRectZero;
  _initialCTM = CGAffineTransformIdentity;
  _invInitialCTM = CGAffineTransformIdentity;
  _viewBoxTransform = CGAffineTransformIdentity;

  _clipPaths = nil;
  _templates = nil;
  _painters = nil;
  _markers = nil;
  _masks = nil;
  _invviewBoxTransform = CGAffineTransformIdentity;
  rendered = NO;
}
#endif // RCT_NEW_ARCH_ENABLED

- (void)insertReactSubview:(RNSVGView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeReactSubview:(RNSVGView *)subview
{
  [super removeReactSubview:subview];
  [self invalidate];
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are inserted by insertReactSubview:
}

- (void)clearChildCache
{
  if (!rendered) {
    return;
  }
  rendered = false;
  for (__kindof RNSVGNode *node in self.subviews) {
    if ([node isKindOfClass:[RNSVGNode class]]) {
      [node clearChildCache];
    }
  }
}

- (void)invalidate
{
  RNSVGPlatformView *parent = self.superview;
  if ([parent isKindOfClass:[RNSVGNode class]]) {
    if (!rendered) {
      return;
    }
    RNSVGNode *svgNode = (RNSVGNode *)parent;
    [svgNode invalidate];
    rendered = false;
    return;
  }
  [self setNeedsDisplay];
}

- (void)tintColorDidChange
{
  [self invalidate];
  [self clearChildCache];
}

- (void)setMinX:(CGFloat)minX
{
  if (minX == _minX) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _minX = minX;
}

- (void)setMinY:(CGFloat)minY
{
  if (minY == _minY) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _minY = minY;
}

- (void)setVbWidth:(CGFloat)vbWidth
{
  if (vbWidth == _vbWidth) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _vbWidth = vbWidth;
}

- (void)setVbHeight:(CGFloat)vbHeight
{
  if (_vbHeight == vbHeight) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _vbHeight = vbHeight;
}

- (void)setBbWidth:(RNSVGLength *)bbWidth
{
  if ([bbWidth isEqualTo:_bbWidth]) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _bbWidth = bbWidth;
}

- (void)setBbHeight:(RNSVGLength *)bbHeight
{
  if ([bbHeight isEqualTo:_bbHeight]) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _bbHeight = bbHeight;
}

- (void)setAlign:(NSString *)align
{
  if ([align isEqualToString:_align]) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _align = align;
}

- (void)setMeetOrSlice:(RNSVGVBMOS)meetOrSlice
{
  if (meetOrSlice == _meetOrSlice) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _meetOrSlice = meetOrSlice;
}

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect
{
  rendered = true;
  _clipPaths = nil;
  _templates = nil;
  _painters = nil;
  self.initialCTM = CGContextGetCTM(context);
  self.invInitialCTM = CGAffineTransformInvert(self.initialCTM);
  if (self.align) {
    CGRect tRect = CGRectMake(self.minX, self.minY, self.vbWidth, self.vbHeight);
    _viewBoxTransform = [RNSVGViewBox getTransform:tRect eRect:rect align:self.align meetOrSlice:self.meetOrSlice];
    _invviewBoxTransform = CGAffineTransformInvert(_viewBoxTransform);
    CGContextConcatCTM(context, _viewBoxTransform);
  } else {
    _viewBoxTransform = CGAffineTransformIdentity;
    _invviewBoxTransform = CGAffineTransformIdentity;
  }
  for (RNSVGView *node in self.subviews) {
    if ([node isKindOfClass:[RNSVGNode class]]) {
      RNSVGNode *svg = (RNSVGNode *)node;
      if (svg.responsible && !self.responsible) {
        self.responsible = YES;
      }

      [svg parseReference];
      [svg renderTo:context rect:rect];
    } else {
      [node drawRect:rect];
    }
  }
}

- (void)drawRect:(CGRect)rect
{
  RNSVGPlatformView *parent = self.superview;
  if ([parent isKindOfClass:[RNSVGNode class]]) {
    return;
  }
  _boundingBox = rect;
  CGContextRef context = UIGraphicsGetCurrentContext();

  [self drawToContext:context withRect:[self bounds]];
}

- (RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  CGPoint transformed = point;
  if (self.align) {
    transformed = CGPointApplyAffineTransform(transformed, _invviewBoxTransform);
  }
  for (RNSVGNode *node in [self.subviews reverseObjectEnumerator]) {
    if (![node isKindOfClass:[RNSVGNode class]]) {
      continue;
    }

    if (event) {
      node.active = NO;
    }

    RNSVGPlatformView *hitChild = [node hitTest:transformed withEvent:event];

    if (hitChild) {
      node.active = YES;
      return (node.responsible || (node != hitChild)) ? hitChild : self;
    }
  }
  return nil;
}

- (NSString *)getDataURLWithBounds:(CGRect)bounds
{
#if !TARGET_OS_OSX // [macOS]
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:bounds.size];
  UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull rendererContext) {
#else // [macOS
  UIGraphicsBeginImageContextWithOptions(bounds.size, NO, 1);
#endif // macOS]
    [self clearChildCache];
    [self drawRect:bounds];
    [self clearChildCache];
    [self invalidate];
#if !TARGET_OS_OSX // [macOS]
  }];
#endif
#if !TARGET_OS_OSX // [macOS]
  NSData *imageData = UIImagePNGRepresentation(image);
  NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
#else // [macOS
  NSData *imageData = UIImagePNGRepresentation(UIGraphicsGetImageFromCurrentImageContext());
  NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
  UIGraphicsEndImageContext();
#endif // macOS]
  return base64;
}

- (void)reactSetInheritedBackgroundColor:(RNSVGColor *)inheritedBackgroundColor
{
  self.backgroundColor = inheritedBackgroundColor;
}

- (void)defineClipPath:(__kindof RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName
{
  if (!_clipPaths) {
    _clipPaths = [[NSMutableDictionary alloc] init];
  }
  [_clipPaths setObject:clipPath forKey:clipPathName];
}

- (RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName
{
  return _clipPaths ? [_clipPaths objectForKey:clipPathName] : nil;
}

- (void)defineTemplate:(RNSVGNode *)definedTemplate templateName:(NSString *)templateName
{
  if (!_templates) {
    _templates = [[NSMutableDictionary alloc] init];
  }
  [_templates setObject:definedTemplate forKey:templateName];
}

- (RNSVGNode *)getDefinedTemplate:(NSString *)templateName
{
  return _templates ? [_templates objectForKey:templateName] : nil;
}

- (void)definePainter:(RNSVGPainter *)painter painterName:(NSString *)painterName
{
  if (!_painters) {
    _painters = [[NSMutableDictionary alloc] init];
  }
  [_painters setObject:painter forKey:painterName];
}

- (RNSVGPainter *)getDefinedPainter:(NSString *)painterName;
{
  return _painters ? [_painters objectForKey:painterName] : nil;
}

- (void)defineMarker:(RNSVGNode *)marker markerName:(NSString *)markerName
{
  if (!_markers) {
    _markers = [[NSMutableDictionary alloc] init];
  }
  [_markers setObject:marker forKey:markerName];
}

- (RNSVGNode *)getDefinedMarker:(NSString *)markerName;
{
  return _markers ? [_markers objectForKey:markerName] : nil;
}

- (void)defineMask:(RNSVGNode *)mask maskName:(NSString *)maskName
{
  if (!_masks) {
    _masks = [[NSMutableDictionary alloc] init];
  }
  [_masks setObject:mask forKey:maskName];
}

- (RNSVGNode *)getDefinedMask:(NSString *)maskName;
{
  return _masks ? [_masks objectForKey:maskName] : nil;
}

- (CGRect)getContextBounds
{
  return CGContextGetClipBoundingBox(UIGraphicsGetCurrentContext());
}

- (CGAffineTransform)getViewBoxTransform
{
  return _viewBoxTransform;
}

@end

#ifdef RCT_NEW_ARCH_ENABLED
Class<RCTComponentViewProtocol> RNSVGSvgViewCls(void)
{
  return RNSVGSvgView.class;
}
#endif // RCT_NEW_ARCH_ENABLED
