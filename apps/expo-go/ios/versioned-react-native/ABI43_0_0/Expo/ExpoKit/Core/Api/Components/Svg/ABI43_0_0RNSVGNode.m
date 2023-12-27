/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RNSVGNode.h"
#import "ABI43_0_0RNSVGContainer.h"
#import "ABI43_0_0RNSVGClipPath.h"
#import "ABI43_0_0RNSVGGroup.h"
#import "ABI43_0_0RNSVGGlyphContext.h"

@interface ABI43_0_0RNSVGNode()
@property (nonatomic, readwrite, weak) ABI43_0_0RNSVGSvgView *svgView;
@property (nonatomic, readwrite, weak) ABI43_0_0RNSVGGroup *textRoot;
@end

@implementation ABI43_0_0RNSVGNode
{
    ABI43_0_0RNSVGGlyphContext *glyphContext;
    BOOL _transparent;
    ABI43_0_0RNSVGClipPath *_clipNode;
    CGPathRef _cachedClipPath;
    CGFloat canvasWidth;
    CGFloat canvasHeight;
    CGFloat canvasDiagonal;
}

CGFloat const ABI43_0_0RNSVG_M_SQRT1_2l = (CGFloat)0.707106781186547524400844362104849039;
CGFloat const ABI43_0_0RNSVG_DEFAULT_FONT_SIZE = 12;

- (instancetype)init
{
    if (self = [super init]) {
        self.opacity = 1;
        self.opaque = false;
        self.matrix = CGAffineTransformIdentity;
        self.transforms = CGAffineTransformIdentity;
        self.invTransform = CGAffineTransformIdentity;
        _merging = false;
        _dirty = false;
    }
    return self;
}

- (void)insertABI43_0_0ReactSubview:(ABI43_0_0RNSVGView *)subview atIndex:(NSInteger)atIndex
{
    [super insertABI43_0_0ReactSubview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeABI43_0_0ReactSubview:(ABI43_0_0RNSVGView *)subview
{
    [super removeABI43_0_0ReactSubview:subview];
    [self invalidate];
}

- (void)didUpdateABI43_0_0ReactSubviews
{
    // Do nothing, as subviews are inserted by insertABI43_0_0ReactSubview:
}

- (void)invalidate
{
    if (_dirty || _merging) {
        return;
    }
    _dirty = true;
    id<ABI43_0_0RNSVGContainer> container = (id<ABI43_0_0RNSVGContainer>)self.superview;
    [container invalidate];
    [self clearPath];
    canvasWidth = -1;
    canvasHeight = -1;
    canvasDiagonal = -1;
}

- (void)clearPath
{
    CGPathRelease(_path);
    self.path = nil;
}

- (void)clearChildCache
{
    [self clearPath];
    for (__kindof ABI43_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI43_0_0RNSVGNode class]]) {
            [node clearChildCache];
        }
    }
}

- (void)clearParentCache
{
    ABI43_0_0RNSVGNode* node = self;
    while (node != nil) {
        ABI43_0_0RNSVGPlatformView* parent = [node superview];

        if (![parent isKindOfClass:[ABI43_0_0RNSVGNode class]]) {
            return;
        }
        node = (ABI43_0_0RNSVGNode*)parent;
        if (!node.path) {
            return;
        }
        [node clearPath];
    }
}

- (ABI43_0_0RNSVGGroup *)textRoot
{
    if (_textRoot) {
        return _textRoot;
    }

    ABI43_0_0RNSVGNode* node = self;
    while (node != nil) {
        if ([node isKindOfClass:[ABI43_0_0RNSVGGroup class]] && [((ABI43_0_0RNSVGGroup*) node) getGlyphContext] != nil) {
            _textRoot = (ABI43_0_0RNSVGGroup*)node;
            break;
        }

        ABI43_0_0RNSVGPlatformView* parent = [node superview];

        if (![node isKindOfClass:[ABI43_0_0RNSVGNode class]]) {
            node = nil;
        } else {
            node = (ABI43_0_0RNSVGNode*)parent;
        }
    }

    return _textRoot;
}

- (ABI43_0_0RNSVGGroup *)getParentTextRoot
{
    ABI43_0_0RNSVGNode* parent = (ABI43_0_0RNSVGGroup*)[self superview];
    if (![parent isKindOfClass:[ABI43_0_0RNSVGGroup class]]) {
        return nil;
    } else {
        return parent.textRoot;
    }
}

- (CGFloat)getFontSizeFromContext
{
    ABI43_0_0RNSVGGroup* root = self.textRoot;
    if (root == nil) {
        return ABI43_0_0RNSVG_DEFAULT_FONT_SIZE;
    }

    if (glyphContext == nil) {
        glyphContext = [root getGlyphContext];
    }

    return [glyphContext getFontSize];
}

- (void)ABI43_0_0ReactSetInheritedBackgroundColor:(ABI43_0_0RNSVGColor *)inheritedBackgroundColor
{
    self.backgroundColor = inheritedBackgroundColor;
}

- (void)setPointerEvents:(ABI43_0_0RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != ABI43_0_0RCTPointerEventsNone);
  if (pointerEvents == ABI43_0_0RCTPointerEventsBoxNone) {
#if TARGET_OS_OSX
    self.accessibilityModal = NO;
#else
    self.accessibilityViewIsModal = NO;
#endif
  }
}

- (void)setName:(NSString *)name
{
    if ([name isEqualToString:_name]) {
        return;
    }

    [self invalidate];
    _name = name;
}

- (void)setDisplay:(NSString *)display
{
    if ([display isEqualToString:_display]) {
        return;
    }

    [self invalidate];
    _display = display;
}

- (void)setOpacity:(CGFloat)opacity
{
    if (opacity == _opacity) {
        return;
    }

    if (opacity <= 0) {
        opacity = 0;
    } else if (opacity > 1) {
        opacity = 1;
    }

    [self invalidate];
    _transparent = opacity < 1;
    _opacity = opacity;
}

- (void)setMatrix:(CGAffineTransform)matrix
{
    if (CGAffineTransformEqualToTransform(matrix, _matrix)) {
        return;
    }
    _matrix = matrix;
    _invmatrix = CGAffineTransformInvert(matrix);
    id<ABI43_0_0RNSVGContainer> container = (id<ABI43_0_0RNSVGContainer>)self.superview;
    [container invalidate];
}

- (void)setClientRect:(CGRect)clientRect {
    if (CGRectEqualToRect(_clientRect, clientRect)) {
        return;
    }
    _clientRect = clientRect;
    if (self.onLayout) {
        self.onLayout(@{
                        @"layout": @{
                                @"x": @(_clientRect.origin.x),
                                @"y": @(_clientRect.origin.y),
                                @"width": @(_clientRect.size.width),
                                @"height": @(_clientRect.size.height),
                                }
                        });

    }
}

- (void)setClipPath:(NSString *)clipPath
{
    if ([_clipPath isEqualToString:clipPath]) {
        return;
    }
    CGPathRelease(_cachedClipPath);
    _cachedClipPath = nil;
    _clipPath = clipPath;
    [self invalidate];
}

- (void)setClipRule:(ABI43_0_0RNSVGCGFCRule)clipRule
{
    if (_clipRule == clipRule) {
        return;
    }
    CGPathRelease(_cachedClipPath);
    _cachedClipPath = nil;
    _clipRule = clipRule;
    [self invalidate];
}

- (void)setMask:(NSString *)mask
{
    if ([_mask isEqualToString:mask]) {
        return;
    }
    _mask = mask;
    [self invalidate];
}

- (void)setMarkerStart:(NSString *)markerStart
{
    if ([_markerStart isEqualToString:markerStart]) {
        return;
    }
    _markerStart = markerStart;
    [self invalidate];
}

- (void)setMarkerMid:(NSString *)markerMid
{
    if ([_markerMid isEqualToString:markerMid]) {
        return;
    }
    _markerMid = markerMid;
    [self invalidate];
}

- (void)setMarkerEnd:(NSString *)markerEnd
{
    if ([_markerEnd isEqualToString:markerEnd]) {
        return;
    }
    _markerEnd = markerEnd;
    [self invalidate];
}

- (void)beginTransparencyLayer:(CGContextRef)context
{
    if (_transparent) {
        CGContextBeginTransparencyLayer(context, NULL);
    }
}

- (void)endTransparencyLayer:(CGContextRef)context
{
    if (_transparent) {
        CGContextEndTransparencyLayer(context);
    }
}

- (void)renderTo:(CGContextRef)context rect:(CGRect)rect
{
    self.dirty = false;
    // abstract
}

- (CGPathRef)getClipPath
{
    return _cachedClipPath;
}

- (CGPathRef)getClipPath:(CGContextRef)context
{
    if (self.clipPath) {
        _clipNode = (ABI43_0_0RNSVGClipPath*)[self.svgView getDefinedClipPath:self.clipPath];
        if (_cachedClipPath) {
            CGPathRelease(_cachedClipPath);
        }
        CGAffineTransform transform = CGAffineTransformConcat(_clipNode.matrix, _clipNode.transforms);
        _cachedClipPath = CGPathCreateCopyByTransformingPath([_clipNode getPath:context], &transform);
    }

    return _cachedClipPath;
}

- (void)clip:(CGContextRef)context
{
    CGPathRef clipPath = [self getClipPath:context];

    if (clipPath) {
        CGContextAddPath(context, clipPath);
        if (_clipRule == kRNSVGCGFCRuleEvenodd) {
            CGContextEOClip(context);
        } else {
            CGContextClip(context);
        }
    }
}

- (CGPathRef)getPath: (CGContextRef)context
{
    // abstract
    return nil;
}

- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect
{
    // abstract
}

// hitTest delagate
- (ABI43_0_0RNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{

    // abstract
    return nil;
}

- (ABI43_0_0RNSVGSvgView *)svgView
{
    if (_svgView) {
        return _svgView;
    }

    __kindof ABI43_0_0RNSVGPlatformView *parent = self.superview;

    if ([parent class] == [ABI43_0_0RNSVGSvgView class]) {
        _svgView = parent;
    } else if ([parent isKindOfClass:[ABI43_0_0RNSVGNode class]]) {
        _svgView = ((ABI43_0_0RNSVGNode *)parent).svgView;
    } else {
        ABI43_0_0RCTLogError(@"ABI43_0_0RNSVG: %@ should be descendant of a SvgViewShadow.", NSStringFromClass(self.class));
    }

    return _svgView;
}

- (CGFloat)relativeOnWidthString:(NSString *)length
{
    return [ABI43_0_0RNSVGPropHelper fromRelativeWithNSString:length
                                relative:[self getCanvasWidth]
                                fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOnHeightString:(NSString *)length
{
    return [ABI43_0_0RNSVGPropHelper fromRelativeWithNSString:length
                                relative:[self getCanvasHeight]
                                fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOnOtherString:(NSString *)length
{
    return [ABI43_0_0RNSVGPropHelper fromRelativeWithNSString:length
                                relative:[self getCanvasDiagonal]
                                fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOn:(ABI43_0_0RNSVGLength *)length relative:(CGFloat)relative
{
    ABI43_0_0RNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * relative;
    }
    return [self fromRelative:length];
}

- (CGFloat)relativeOnWidth:(ABI43_0_0RNSVGLength *)length
{
    ABI43_0_0RNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * [self getCanvasWidth];
    }
    return [self fromRelative:length];
}

- (CGFloat)relativeOnHeight:(ABI43_0_0RNSVGLength *)length
{
    ABI43_0_0RNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * [self getCanvasHeight];
    }
    return [self fromRelative:length];
}

- (CGFloat)relativeOnOther:(ABI43_0_0RNSVGLength *)length
{
    ABI43_0_0RNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * [self getCanvasDiagonal];
    }
    return [self fromRelative:length];
}

- (CGFloat)fromRelative:(ABI43_0_0RNSVGLength*)length {
    CGFloat unit;
    switch (length.unit) {
        case SVG_LENGTHTYPE_EMS:
            unit = [self getFontSizeFromContext];
            break;
        case SVG_LENGTHTYPE_EXS:
            unit = [self getFontSizeFromContext] / 2;
            break;

        case SVG_LENGTHTYPE_CM:
            unit = (CGFloat)35.43307;
            break;
        case SVG_LENGTHTYPE_MM:
            unit = (CGFloat)3.543307;
            break;
        case SVG_LENGTHTYPE_IN:
            unit = 90;
            break;
        case SVG_LENGTHTYPE_PT:
            unit = 1.25;
            break;
        case SVG_LENGTHTYPE_PC:
            unit = 15;
            break;

        default:
            unit = 1;
    }
    return length.value * unit;
}

- (CGRect)getContextBounds
{
    return CGContextGetClipBoundingBox(UIGraphicsGetCurrentContext());
}

- (CGFloat)getContextWidth
{
    return CGRectGetWidth([self getContextBounds]);
}

- (CGFloat)getContextHeight
{
    return CGRectGetHeight([self getContextBounds]);
}

- (CGFloat)getContextDiagonal {
    CGRect bounds = [self getContextBounds];
    CGFloat width = CGRectGetWidth(bounds);
    CGFloat height = CGRectGetHeight(bounds);
    CGFloat powX = width * width;
    CGFloat powY = height * height;
    CGFloat r = sqrt(powX + powY) * ABI43_0_0RNSVG_M_SQRT1_2l;
    return r;
}

- (CGFloat) getCanvasWidth {
    if (canvasWidth != -1) {
        return canvasWidth;
    }
    ABI43_0_0RNSVGGroup* root = [self textRoot];
    if (root == nil) {
        canvasWidth = [self getContextWidth];
    } else {
        canvasWidth = [[root getGlyphContext] getWidth];
    }

    return canvasWidth;
}

- (CGFloat) getCanvasHeight {
    if (canvasHeight != -1) {
        return canvasHeight;
    }
    ABI43_0_0RNSVGGroup* root = [self textRoot];
    if (root == nil) {
        canvasHeight = [self getContextHeight];
    } else {
        canvasHeight = [[root getGlyphContext] getHeight];
    }

    return canvasHeight;
}

- (CGFloat) getCanvasDiagonal {
    if (canvasDiagonal != -1) {
        return canvasDiagonal;
    }
    CGFloat width = [self getCanvasWidth];
    CGFloat height = [self getCanvasHeight];
    CGFloat powX = width * width;
    CGFloat powY = height * height;
    canvasDiagonal = sqrt(powX + powY) * ABI43_0_0RNSVG_M_SQRT1_2l;
    return canvasDiagonal;
}

- (void)parseReference
{
    self.dirty = false;
    if (self.name) {
        typeof(self) __weak weakSelf = self;
        [self.svgView defineTemplate:weakSelf templateName:self.name];
    }
}

- (void)traverseSubviews:(BOOL (^)(__kindof ABI43_0_0RNSVGView *node))block
{
    for (ABI43_0_0RNSVGView *node in self.subviews) {
        if (!block(node)) {
            break;
        }
    }
}

- (void)dealloc
{
    CGPathRelease(_cachedClipPath);
    CGPathRelease(_strokePath);
    CGPathRelease(_path);
}

@end
