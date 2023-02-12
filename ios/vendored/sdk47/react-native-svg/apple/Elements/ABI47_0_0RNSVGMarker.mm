/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
#import "ABI47_0_0RNSVGMarker.h"
#import "ABI47_0_0RNSVGBrushType.h"
#import "ABI47_0_0RNSVGNode.h"
#import "ABI47_0_0RNSVGPainter.h"
#import "ABI47_0_0RNSVGViewBox.h"

#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTConversions.h>
#import <ABI47_0_0React/ABI47_0_0RCTFabricComponentsPlugins.h>
#import <react/renderer/components/rnsvg/ComponentDescriptors.h>
#import <react/renderer/components/view/conversions.h>
#import "ABI47_0_0RNSVGFabricConversions.h"
#endif // RN_FABRIC_ENABLED

@implementation ABI47_0_0RNSVGMarker

#ifdef RN_FABRIC_ENABLED
using namespace ABI47_0_0facebook::react;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ABI47_0_0RNSVGMarkerProps>();
    _props = defaultProps;
  }
  return self;
}

#pragma mark - ABI47_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ABI47_0_0RNSVGMarkerComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ABI47_0_0RNSVGMarkerProps>(props);

  self.refX = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.refX)];
  self.refY = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.refY)];
  self.markerHeight = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.markerHeight)];
  self.markerWidth = [ABI47_0_0RNSVGLength lengthWithString:ABI47_0_0RCTNSStringFromString(newProps.markerWidth)];
  self.markerUnits = ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.markerUnits);
  self.orient = ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.orient);

  self.minX = newProps.minX;
  self.minY = newProps.minY;
  self.vbWidth = newProps.vbWidth;
  self.vbHeight = newProps.vbHeight;
  self.align = ABI47_0_0RCTNSStringFromStringNilIfEmpty(newProps.align);
  self.meetOrSlice = intToRNSVGVBMOS(newProps.meetOrSlice);

  setCommonGroupProps(newProps, self);
  _props = std::static_pointer_cast<ABI47_0_0RNSVGMarkerProps const>(props);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _refX = nil;
  _refY = nil;
  _markerHeight = nil;
  _markerWidth = nil;
  _markerUnits = nil;
  _orient = nil;

  _minX = 0;
  _minY = 0;
  _vbWidth = 0;
  _vbHeight = 0;
  _align = nil;
  _meetOrSlice = kRNSVGVBMOSMeet;
}
#endif // RN_FABRIC_ENABLED

- (ABI47_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

- (void)parseReference
{
  self.dirty = false;
  [self.svgView defineMarker:self markerName:self.name];
  [self traverseSubviews:^(ABI47_0_0RNSVGNode *node) {
    if ([node isKindOfClass:[ABI47_0_0RNSVGNode class]]) {
      [node parseReference];
    }
    return YES;
  }];
}

- (void)setX:(ABI47_0_0RNSVGLength *)refX
{
  if ([refX isEqualTo:_refX]) {
    return;
  }

  _refX = refX;
  [self invalidate];
}

- (void)setY:(ABI47_0_0RNSVGLength *)refY
{
  if ([refY isEqualTo:_refY]) {
    return;
  }

  _refY = refY;
  [self invalidate];
}

- (void)setMarkerWidth:(ABI47_0_0RNSVGLength *)markerWidth
{
  if ([markerWidth isEqualTo:_markerWidth]) {
    return;
  }

  _markerWidth = markerWidth;
  [self invalidate];
}

- (void)setMarkerHeight:(ABI47_0_0RNSVGLength *)markerHeight
{
  if ([markerHeight isEqualTo:_markerHeight]) {
    return;
  }

  _markerHeight = markerHeight;
  [self invalidate];
}

- (void)setMarkerUnits:(NSString *)markerUnits
{
  if ([_markerUnits isEqualToString:markerUnits]) {
    return;
  }

  _markerUnits = markerUnits;
  [self invalidate];
}

- (void)setOrient:(NSString *)orient
{
  if ([orient isEqualToString:_orient]) {
    return;
  }

  [self invalidate];
  _orient = orient;
}

- (void)setMinX:(CGFloat)minX
{
  if (minX == _minX) {
    return;
  }

  [self invalidate];
  _minX = minX;
}

- (void)setMinY:(CGFloat)minY
{
  if (minY == _minY) {
    return;
  }

  [self invalidate];
  _minY = minY;
}

- (void)setVbWidth:(CGFloat)vbWidth
{
  if (vbWidth == _vbWidth) {
    return;
  }

  [self invalidate];
  _vbWidth = vbWidth;
}

- (void)setVbHeight:(CGFloat)vbHeight
{
  if (_vbHeight == vbHeight) {
    return;
  }

  [self invalidate];
  _vbHeight = vbHeight;
}

- (void)setAlign:(NSString *)align
{
  if ([align isEqualToString:_align]) {
    return;
  }

  [self invalidate];
  _align = align;
}

- (void)setMeetOrSlice:(ABI47_0_0RNSVGVBMOS)meetOrSlice
{
  if (meetOrSlice == _meetOrSlice) {
    return;
  }

  [self invalidate];
  _meetOrSlice = meetOrSlice;
}

static CGFloat ABI47_0_0RNSVG_degToRad = (CGFloat)M_PI / 180;

double ABI47_0_0deg2rad(CGFloat deg)
{
  return deg * ABI47_0_0RNSVG_degToRad;
}

- (void)renderMarker:(CGContextRef)context
                rect:(CGRect)rect
            position:(ABI47_0_0RNSVGMarkerPosition *)position
         strokeWidth:(CGFloat)strokeWidth
{
  CGContextSaveGState(context);

  CGPoint origin = [position origin];
  CGAffineTransform transform = CGAffineTransformMakeTranslation(origin.x, origin.y);

  float markerAngle = [@"auto" isEqualToString:_orient] ? -1 : [_orient doubleValue];
  float angle = 180 + (markerAngle == -1 ? [position angle] : markerAngle);
  float rad = ABI47_0_0deg2rad(angle);
  transform = CGAffineTransformRotate(transform, rad);

  bool useStrokeWidth = [@"strokeWidth" isEqualToString:_markerUnits];
  if (useStrokeWidth) {
    transform = CGAffineTransformScale(transform, strokeWidth, strokeWidth);
  }

  CGFloat width = [self relativeOnWidth:self.markerWidth];
  CGFloat height = [self relativeOnHeight:self.markerHeight];
  CGRect eRect = CGRectMake(0, 0, width, height);
  if (self.align) {
    CGAffineTransform viewBoxTransform =
        [ABI47_0_0RNSVGViewBox getTransform:CGRectMake(self.minX, self.minY, self.vbWidth, self.vbHeight)
                             eRect:eRect
                             align:self.align
                       meetOrSlice:self.meetOrSlice];
    transform = CGAffineTransformScale(transform, viewBoxTransform.a, viewBoxTransform.d);
  }

  CGFloat x = [self relativeOnWidth:self.refX];
  CGFloat y = [self relativeOnHeight:self.refY];
  transform = CGAffineTransformTranslate(transform, -x, -y);

  self.transform = transform;
  CGContextConcatCTM(context, transform);

  [self renderGroupTo:context rect:eRect];

  CGContextRestoreGState(context);
}

@end

#ifdef RN_FABRIC_ENABLED
Class<ABI47_0_0RCTComponentViewProtocol> ABI47_0_0RNSVGMarkerCls(void)
{
  return ABI47_0_0RNSVGMarker.class;
}
#endif // RN_FABRIC_ENABLED
