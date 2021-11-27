/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGNode.h"
#import "DevLauncherRNSVGContainer.h"
#import "DevLauncherRNSVGClipPath.h"
#import "DevLauncherRNSVGGroup.h"
#import "DevLauncherRNSVGGlyphContext.h"

@interface DevLauncherRNSVGNode()
@property (nonatomic, readwrite, weak) DevLauncherRNSVGSvgView *svgView;
@property (nonatomic, readwrite, weak) DevLauncherRNSVGGroup *textRoot;
@end

@implementation DevLauncherRNSVGNode
{
    DevLauncherRNSVGGlyphContext *glyphContext;
    BOOL _transparent;
    DevLauncherRNSVGClipPath *_clipNode;
    CGPathRef _cachedClipPath;
    CGFloat canvasWidth;
    CGFloat canvasHeight;
    CGFloat canvasDiagonal;
}

CGFloat const DevLauncherRNSVG_M_SQRT1_2l = (CGFloat)0.707106781186547524400844362104849039;
CGFloat const DevLauncherRNSVG_DEFAULT_FONT_SIZE = 12;

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

- (void)insertReactSubview:(DevLauncherRNSVGView *)subview atIndex:(NSInteger)atIndex
{
    [super insertReactSubview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeReactSubview:(DevLauncherRNSVGView *)subview
{
    [super removeReactSubview:subview];
    [self invalidate];
}

- (void)didUpdateReactSubviews
{
    // Do nothing, as subviews are inserted by insertReactSubview:
}

- (void)invalidate
{
    if (_dirty || _merging) {
        return;
    }
    _dirty = true;
    id<DevLauncherRNSVGContainer> container = (id<DevLauncherRNSVGContainer>)self.superview;
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
    for (__kindof DevLauncherRNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[DevLauncherRNSVGNode class]]) {
            [node clearChildCache];
        }
    }
}

- (void)clearParentCache
{
    DevLauncherRNSVGNode* node = self;
    while (node != nil) {
        DevLauncherRNSVGPlatformView* parent = [node superview];

        if (![parent isKindOfClass:[DevLauncherRNSVGNode class]]) {
            return;
        }
        node = (DevLauncherRNSVGNode*)parent;
        if (!node.path) {
            return;
        }
        [node clearPath];
    }
}

- (DevLauncherRNSVGGroup *)textRoot
{
    if (_textRoot) {
        return _textRoot;
    }

    DevLauncherRNSVGNode* node = self;
    while (node != nil) {
        if ([node isKindOfClass:[DevLauncherRNSVGGroup class]] && [((DevLauncherRNSVGGroup*) node) getGlyphContext] != nil) {
            _textRoot = (DevLauncherRNSVGGroup*)node;
            break;
        }

        DevLauncherRNSVGPlatformView* parent = [node superview];

        if (![node isKindOfClass:[DevLauncherRNSVGNode class]]) {
            node = nil;
        } else {
            node = (DevLauncherRNSVGNode*)parent;
        }
    }

    return _textRoot;
}

- (DevLauncherRNSVGGroup *)getParentTextRoot
{
    DevLauncherRNSVGNode* parent = (DevLauncherRNSVGGroup*)[self superview];
    if (![parent isKindOfClass:[DevLauncherRNSVGGroup class]]) {
        return nil;
    } else {
        return parent.textRoot;
    }
}

- (CGFloat)getFontSizeFromContext
{
    DevLauncherRNSVGGroup* root = self.textRoot;
    if (root == nil) {
        return DevLauncherRNSVG_DEFAULT_FONT_SIZE;
    }

    if (glyphContext == nil) {
        glyphContext = [root getGlyphContext];
    }

    return [glyphContext getFontSize];
}

- (void)reactSetInheritedBackgroundColor:(DevLauncherRNSVGColor *)inheritedBackgroundColor
{
    self.backgroundColor = inheritedBackgroundColor;
}

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != RCTPointerEventsNone);
  if (pointerEvents == RCTPointerEventsBoxNone) {
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
    id<DevLauncherRNSVGContainer> container = (id<DevLauncherRNSVGContainer>)self.superview;
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

- (void)setClipRule:(DevLauncherRNSVGCGFCRule)clipRule
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
        _clipNode = (DevLauncherRNSVGClipPath*)[self.svgView getDefinedClipPath:self.clipPath];
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
        if (_clipRule == kDevLauncherRNSVGCGFCRuleEvenodd) {
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
- (DevLauncherRNSVGPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{

    // abstract
    return nil;
}

- (DevLauncherRNSVGSvgView *)svgView
{
    if (_svgView) {
        return _svgView;
    }

    __kindof DevLauncherRNSVGPlatformView *parent = self.superview;

    if ([parent class] == [DevLauncherRNSVGSvgView class]) {
        _svgView = parent;
    } else if ([parent isKindOfClass:[DevLauncherRNSVGNode class]]) {
        _svgView = ((DevLauncherRNSVGNode *)parent).svgView;
    } else {
        RCTLogError(@"DevLauncherRNSVG: %@ should be descendant of a SvgViewShadow.", NSStringFromClass(self.class));
    }

    return _svgView;
}

- (CGFloat)relativeOnWidthString:(NSString *)length
{
    return [DevLauncherRNSVGPropHelper fromRelativeWithNSString:length
                                relative:[self getCanvasWidth]
                                fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOnHeightString:(NSString *)length
{
    return [DevLauncherRNSVGPropHelper fromRelativeWithNSString:length
                                relative:[self getCanvasHeight]
                                fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOnOtherString:(NSString *)length
{
    return [DevLauncherRNSVGPropHelper fromRelativeWithNSString:length
                                relative:[self getCanvasDiagonal]
                                fontSize:[self getFontSizeFromContext]];
}

- (CGFloat)relativeOn:(DevLauncherRNSVGLength *)length relative:(CGFloat)relative
{
    DevLauncherRNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * relative;
    }
    return [self fromRelative:length];
}

- (CGFloat)relativeOnWidth:(DevLauncherRNSVGLength *)length
{
    DevLauncherRNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * [self getCanvasWidth];
    }
    return [self fromRelative:length];
}

- (CGFloat)relativeOnHeight:(DevLauncherRNSVGLength *)length
{
    DevLauncherRNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * [self getCanvasHeight];
    }
    return [self fromRelative:length];
}

- (CGFloat)relativeOnOther:(DevLauncherRNSVGLength *)length
{
    DevLauncherRNSVGLengthUnitType unit = length.unit;
    if (unit == SVG_LENGTHTYPE_NUMBER){
        return length.value;
    } else if (unit == SVG_LENGTHTYPE_PERCENTAGE){
        return length.value / 100 * [self getCanvasDiagonal];
    }
    return [self fromRelative:length];
}

- (CGFloat)fromRelative:(DevLauncherRNSVGLength*)length {
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
    CGFloat r = sqrt(powX + powY) * DevLauncherRNSVG_M_SQRT1_2l;
    return r;
}

- (CGFloat) getCanvasWidth {
    if (canvasWidth != -1) {
        return canvasWidth;
    }
    DevLauncherRNSVGGroup* root = [self textRoot];
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
    DevLauncherRNSVGGroup* root = [self textRoot];
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
    canvasDiagonal = sqrt(powX + powY) * DevLauncherRNSVG_M_SQRT1_2l;
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

- (void)traverseSubviews:(BOOL (^)(__kindof DevLauncherRNSVGView *node))block
{
    for (DevLauncherRNSVGView *node in self.subviews) {
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
