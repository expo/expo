/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RNSVGSvgView.h"
#import <ABI47_0_0React/ABI47_0_0RCTLog.h>
#import "ABI47_0_0RNSVGNode.h"
#import "ABI47_0_0RNSVGViewBox.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI47_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI47_0_0RNSVGSvgView {
  NSMutableDictionary<NSString *, ABI47_0_0RNSVGNode *> *_clipPaths;
  NSMutableDictionary<NSString *, ABI47_0_0RNSVGNode *> *_templates;
  NSMutableDictionary<NSString *, ABI47_0_0RNSVGPainter *> *_painters;
  NSMutableDictionary<NSString *, ABI47_0_0RNSVGNode *> *_markers;
  NSMutableDictionary<NSString *, ABI47_0_0RNSVGNode *> *_masks;
  CGAffineTransform _invviewBoxTransform;
  bool rendered;
}

#ifdef RN_FABRIC_ENABLED
using namespace ABI47_0_0facebook::react;
#endif // RN_FABRIC_ENABLED

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
#if !TARGET_OS_OSX // Not available on macOS
    // This is necessary to ensure that [self setNeedsDisplay] actually triggers
    // a redraw when our parent transitions between hidden and visible.
    self.contentMode = UIViewContentModeRedraw;
#endif // TARGET_OS_OSX
    rendered = false;
#ifdef RN_FABRIC_ENABLED
    static const auto defaultProps = std::make_shared<const ABI47_0_0RNSVGSvgViewProps>();
    _props = defaultProps;
    // TODO: think if we can do it better
    self.opaque = NO;
#endif // RN_FABRIC_ENABLED
  }
  return self;
}

#ifdef RN_FABRIC_ENABLED
#pragma mark - ABI47_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI47_0_0RNSVGSvgViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI47_0_0RNSVGSvgViewProps>(props);

  self.minX = newProps.minX;
  self.minY = newProps.minY;
  self.vbWidth = newProps.vbWidth;
  self.vbHeight = newProps.vbHeight;
  self.bbWidth = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.bbWidth)];
  self.bbHeight = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.bbHeight)];
  self.align = ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.align);
  self.meetOrSlice = intToRNSVGVBMOS(newProps.meetOrSlice);
  if (ABI47_0_0RCTUIColorFromSharedColor(newProps.tintColor)) {
    self.tintColor = ABI47_0_0RCTUIColorFromSharedColor(newProps.tintColor);
  }
  if (ABI47_0_0RCTUIColorFromSharedColor(newProps.color)) {
    self.tintColor = ABI47_0_0RCTUIColorFromSharedColor(newProps.color);
  }
  _props = std::static_pointer_cast<ABI47_0_0RNSVGSvgViewProps const>(props);
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
#endif // RN_FABRIC_ENABLED

- (void)insertABI47_0_0ReactSubview:(ABI47_0_0RNSVGView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI47_0_0ReactSubview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeABI47_0_0ReactSubview:(ABI47_0_0RNSVGView *)subview
{
  [super removeABI47_0_0ReactSubview:subview];
  [self invalidate];
}

- (void)didUpdateABI47_0_0ReactSubviews
{
  // Do nothing, as subviews are inserted by insertABI47_0_0ReactSubview:
}

- (void)clearChildCache
{
  if (!rendered) {
    return;
  }
  rendered = false;
  for (__kindof ABI47_0_0RNSVGNode *node in self.subviews) {
    if ([node isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
      [node clearChildCache];
    }
  }
}

- (void)invalidate
{
  ABI47_0_0RNSVGPlatformView *parent = self.superview;
  if ([parent isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
    if (!rendered) {
      return;
    }
    ABI47_0_0RNSVGNode *svgNode = (ABI47_0_0RNSVGNode *)parent;
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

- (void)setBbWidth:(ABI47_0_0RNSVGLength *)bbWidth
{
  if ([bbWidth isEqualTo:_bbWidth]) {
    return;
  }

  [self invalidate];
  [self clearChildCache];
  _bbWidth = bbWidth;
}

- (void)setBbHeight:(ABI47_0_0RNSVGLength *)bbHeight
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

- (void)setMeetOrSlice:(ABI47_0_0RNSVGVBMOS)meetOrSlice
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
  self.initialCTM = CGContextGetCTM(context);
  self.invInitialCTM = CGAffineTransformInvert(self.initialCTM);
  if (self.align) {
    CGRect tRect = CGRectMake(self.minX, self.minY, self.vbWidth, self.vbHeight);
    _viewBoxTransform = [ABI47_0_0RNSVGViewBox getTransform:tRect eRect:rect align:self.align meetOrSlice:self.meetOrSlice];
    _invviewBoxTransform = CGAffineTransformInvert(_viewBoxTransform);
    CGContextConcatCTM(context, _viewBoxTransform);
  } else {
    _viewBoxTransform = CGAffineTransformIdentity;
    _invviewBoxTransform = CGAffineTransformIdentity;
  }

  for (ABI47_0_0RNSVGView *node in self.subviews) {
    if ([node isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
      ABI47_0_0RNSVGNode *svg = (ABI47_0_0RNSVGNode *)node;
      [svg renderTo:context rect:rect];
    } else {
      [node drawRect:rect];
    }
  }
}

- (void)drawRect:(CGRect)rect
{
  ABI47_0_0RNSVGPlatformView *parent = self.superview;
  if ([parent isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
    return;
  }
  rendered = true;
  _clipPaths = nil;
  _templates = nil;
  _painters = nil;
  _boundingBox = rect;
  CGContextRef context = UIGraphicsGetCurrentContext();

  for (ABI47_0_0RNSVGPlatformView *node in self.subviews) {
    if ([node isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
      ABI47_0_0RNSVGNode *svg = (ABI47_0_0RNSVGNode *)node;
      if (svg.responsible && !self.responsible) {
        self.responsible = YES;
      }

      [svg parseReference];
    }
  }

  [self drawToContext:context withRect:rect];
}

- (ABI47_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  CGPoint transformed = point;
  if (self.align) {
    transformed = CGPointApplyAffineTransform(transformed, _invviewBoxTransform);
  }
  for (ABI47_0_0RNSVGNode *node in [self.subviews reverseObjectEnumerator]) {
    if (![node isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
      continue;
    }

    if (event) {
      node.active = NO;
    }

    ABI47_0_0RNSVGPlatformView *hitChild = [node hitTest:transformed withEvent:event];

    if (hitChild) {
      node.active = YES;
      return (node.responsible || (node != hitChild)) ? hitChild : self;
    }
  }
  return nil;
}

- (NSString *)getDataURL
{
  UIGraphicsBeginImageContextWithOptions(_boundingBox.size, NO, 0);
  [self clearChildCache];
  [self drawRect:_boundingBox];
  [self clearChildCache];
  [self invalidate];
  NSData *imageData = UIImagePNGRepresentation(UIGraphicsGetImageFromCurrentImageContext());
  NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
  UIGraphicsEndImageContext();
  return base64;
}

- (NSString *)getDataURLwithBounds:(CGRect)bounds
{
  UIGraphicsBeginImageContextWithOptions(bounds.size, NO, 1);
  [self clearChildCache];
  [self drawRect:bounds];
  [self clearChildCache];
  [self invalidate];
  NSData *imageData = UIImagePNGRepresentation(UIGraphicsGetImageFromCurrentImageContext());
  NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
  UIGraphicsEndImageContext();
  return base64;
}

- (void)reactSetInheritedBackgroundColor:(ABI47_0_0RNSVGColor *)inheritedBackgroundColor
{
  self.backgroundColor = inheritedBackgroundColor;
}

- (void)defineClipPath:(__kindof ABI47_0_0RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName
{
  if (!_clipPaths) {
    _clipPaths = [[NSMutableDictionary alloc] init];
  }
  [_clipPaths setObject:clipPath forKey:clipPathName];
}

- (ABI47_0_0RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName
{
  return _clipPaths ? [_clipPaths objectForKey:clipPathName] : nil;
}

- (void)defineTemplate:(ABI47_0_0RNSVGNode *)definedTemplate templateName:(NSString *)templateName
{
  if (!_templates) {
    _templates = [[NSMutableDictionary alloc] init];
  }
  [_templates setObject:definedTemplate forKey:templateName];
}

- (ABI47_0_0RNSVGNode *)getDefinedTemplate:(NSString *)templateName
{
  return _templates ? [_templates objectForKey:templateName] : nil;
}

- (void)definePainter:(ABI47_0_0RNSVGPainter *)painter painterName:(NSString *)painterName
{
  if (!_painters) {
    _painters = [[NSMutableDictionary alloc] init];
  }
  [_painters setObject:painter forKey:painterName];
}

- (ABI47_0_0RNSVGPainter *)getDefinedPainter:(NSString *)painterName;
{
  return _painters ? [_painters objectForKey:painterName] : nil;
}

- (void)defineMarker:(ABI47_0_0RNSVGNode *)marker markerName:(NSString *)markerName
{
  if (!_markers) {
    _markers = [[NSMutableDictionary alloc] init];
  }
  [_markers setObject:marker forKey:markerName];
}

- (ABI47_0_0RNSVGNode *)getDefinedMarker:(NSString *)markerName;
{
  return _markers ? [_markers objectForKey:markerName] : nil;
}

- (void)defineMask:(ABI47_0_0RNSVGNode *)mask maskName:(NSString *)maskName
{
  if (!_masks) {
    _masks = [[NSMutableDictionary alloc] init];
  }
  [_masks setObject:mask forKey:maskName];
}

- (ABI47_0_0RNSVGNode *)getDefinedMask:(NSString *)maskName;
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

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSVGSvgViewCls(void)
{
  return ABI47_0_0RNSVGSvgView.class;
}
#endif // RN_FABRIC_ENABLED
