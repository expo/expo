/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTViewComponentView.h"

#import <ABI42_0_0React/ABI42_0_0RCTAssert.h>
#import <ABI42_0_0React/ABI42_0_0RCTBorderDrawing.h>
#import <objc/runtime.h>
#import <ABI42_0_0React/components/view/ViewComponentDescriptor.h>
#import <ABI42_0_0React/components/view/ViewEventEmitter.h>
#import <ABI42_0_0React/components/view/ViewProps.h>

#import "ABI42_0_0RCTConversions.h"

using namespace ABI42_0_0facebook::ABI42_0_0React;

@implementation ABI42_0_0RCTViewComponentView {
  UIColor *_backgroundColor;
  CALayer *_borderLayer;
  BOOL _needsInvalidateLayer;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<ViewProps const>();
    _props = defaultProps;
  }
  return self;
}

- (ABI42_0_0facebook::ABI42_0_0React::SharedProps)props
{
  return _props;
}

- (void)setContentView:(UIView *)contentView
{
  if (_contentView) {
    [_contentView removeFromSuperview];
  }

  _contentView = contentView;

  if (_contentView) {
    [self addSubview:_contentView];
  }
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  // Consider whether using `updateLayoutMetrics:oldLayoutMetrics`
  // isn't more appropriate for your use case. `layoutSubviews` is called
  // by UIKit while `updateLayoutMetrics:oldLayoutMetrics` is called
  // by ABI42_0_0React Native Renderer within `CATransaction`.
  // If you are calling `setFrame:` or other methods that cause
  // `layoutSubviews` to be triggered, `_contentView`'s and `_borderLayout`'s
  // frames might get out of sync with `self.bounds`.
}

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  if (UIEdgeInsetsEqualToEdgeInsets(self.hitTestEdgeInsets, UIEdgeInsetsZero)) {
    return [super pointInside:point withEvent:event];
  }
  CGRect hitFrame = UIEdgeInsetsInsetRect(self.bounds, self.hitTestEdgeInsets);
  return CGRectContainsPoint(hitFrame, point);
}

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  _backgroundColor = backgroundColor;
}

#pragma mark - ABI42_0_0RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  ABI42_0_0RCTAssert(
      self == [ABI42_0_0RCTViewComponentView class],
      @"`+[ABI42_0_0RCTComponentViewProtocol componentDescriptorProvider]` must be implemented for all subclasses (and `%@` particularly).",
      NSStringFromClass([self class]));
  return concreteComponentDescriptorProvider<ViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
#ifndef NS_BLOCK_ASSERTIONS
  auto propsRawPtr = _props.get();
  ABI42_0_0RCTAssert(
      propsRawPtr &&
          ([self class] == [ABI42_0_0RCTViewComponentView class] ||
           typeid(*propsRawPtr).hash_code() != typeid(ViewProps const).hash_code()),
      @"`ABI42_0_0RCTViewComponentView` subclasses (and `%@` particularly) must setup `_props`"
       " instance variable with a default value in the constructor.",
      NSStringFromClass([self class]));
#endif

  auto const &oldViewProps = *std::static_pointer_cast<ViewProps const>(_props);
  auto const &newViewProps = *std::static_pointer_cast<ViewProps const>(props);

  BOOL needsInvalidateLayer = NO;

  // `opacity`
  if (oldViewProps.opacity != newViewProps.opacity) {
    self.layer.opacity = (CGFloat)newViewProps.opacity;
    needsInvalidateLayer = YES;
  }

  // `backgroundColor`
  if (oldViewProps.backgroundColor != newViewProps.backgroundColor) {
    self.backgroundColor = ABI42_0_0RCTUIColorFromSharedColor(newViewProps.backgroundColor);
    needsInvalidateLayer = YES;
  }

  // `foregroundColor`
  if (oldViewProps.foregroundColor != newViewProps.foregroundColor) {
    self.foregroundColor = ABI42_0_0RCTUIColorFromSharedColor(newViewProps.foregroundColor);
  }

  // `shadowColor`
  if (oldViewProps.shadowColor != newViewProps.shadowColor) {
    CGColorRef shadowColor = ABI42_0_0RCTCGColorRefFromSharedColor(newViewProps.shadowColor);
    self.layer.shadowColor = shadowColor;
    CGColorRelease(shadowColor);
    needsInvalidateLayer = YES;
  }

  // `shadowOffset`
  if (oldViewProps.shadowOffset != newViewProps.shadowOffset) {
    self.layer.shadowOffset = ABI42_0_0RCTCGSizeFromSize(newViewProps.shadowOffset);
    needsInvalidateLayer = YES;
  }

  // `shadowOpacity`
  if (oldViewProps.shadowOpacity != newViewProps.shadowOpacity) {
    self.layer.shadowOpacity = (CGFloat)newViewProps.shadowOpacity;
    needsInvalidateLayer = YES;
  }

  // `shadowRadius`
  if (oldViewProps.shadowRadius != newViewProps.shadowRadius) {
    self.layer.shadowRadius = (CGFloat)newViewProps.shadowRadius;
    needsInvalidateLayer = YES;
  }

  // `backfaceVisibility`
  if (oldViewProps.backfaceVisibility != newViewProps.backfaceVisibility) {
    self.layer.doubleSided = newViewProps.backfaceVisibility == BackfaceVisibility::Visible;
  }

  // `shouldRasterize`
  if (oldViewProps.shouldRasterize != newViewProps.shouldRasterize) {
    self.layer.shouldRasterize = newViewProps.shouldRasterize;
    self.layer.rasterizationScale = newViewProps.shouldRasterize ? [UIScreen mainScreen].scale : 1.0;
  }

  // `pointerEvents`
  if (oldViewProps.pointerEvents != newViewProps.pointerEvents) {
    self.userInteractionEnabled = newViewProps.pointerEvents != PointerEventsMode::None;
  }

  // `transform`
  if (oldViewProps.transform != newViewProps.transform) {
    self.layer.transform = ABI42_0_0RCTCATransform3DFromTransformMatrix(newViewProps.transform);
    self.layer.allowsEdgeAntialiasing = newViewProps.transform != Transform::Identity();
  }

  // `hitSlop`
  if (oldViewProps.hitSlop != newViewProps.hitSlop) {
    self.hitTestEdgeInsets = ABI42_0_0RCTUIEdgeInsetsFromEdgeInsets(newViewProps.hitSlop);
  }

  // `overflow`
  if (oldViewProps.getClipsContentToBounds() != newViewProps.getClipsContentToBounds()) {
    self.clipsToBounds = newViewProps.getClipsContentToBounds();
    needsInvalidateLayer = YES;
  }

  // `border`
  if (oldViewProps.borderStyles != newViewProps.borderStyles || oldViewProps.borderRadii != newViewProps.borderRadii ||
      oldViewProps.borderColors != newViewProps.borderColors) {
    needsInvalidateLayer = YES;
  }

  // `nativeId`
  if (oldViewProps.nativeId != newViewProps.nativeId) {
    self.nativeId = ABI42_0_0RCTNSStringFromStringNilIfEmpty(newViewProps.nativeId);
  }

  // `accessible`
  if (oldViewProps.accessible != newViewProps.accessible) {
    self.accessibilityElement.isAccessibilityElement = newViewProps.accessible;
  }

  // `accessibilityLabel`
  if (oldViewProps.accessibilityLabel != newViewProps.accessibilityLabel) {
    self.accessibilityElement.accessibilityLabel = ABI42_0_0RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityLabel);
  }

  // `accessibilityHint`
  if (oldViewProps.accessibilityHint != newViewProps.accessibilityHint) {
    self.accessibilityElement.accessibilityHint = ABI42_0_0RCTNSStringFromStringNilIfEmpty(newViewProps.accessibilityHint);
  }

  // `accessibilityViewIsModal`
  if (oldViewProps.accessibilityViewIsModal != newViewProps.accessibilityViewIsModal) {
    self.accessibilityElement.accessibilityViewIsModal = newViewProps.accessibilityViewIsModal;
  }

  // `accessibilityElementsHidden`
  if (oldViewProps.accessibilityElementsHidden != newViewProps.accessibilityElementsHidden) {
    self.accessibilityElement.accessibilityElementsHidden = newViewProps.accessibilityElementsHidden;
  }

  if (oldViewProps.accessibilityTraits != newViewProps.accessibilityTraits) {
    self.accessibilityElement.accessibilityTraits =
        ABI42_0_0RCTUIAccessibilityTraitsFromAccessibilityTraits(newViewProps.accessibilityTraits);
  }

  // `accessibilityIgnoresInvertColors`
  if (oldViewProps.accessibilityIgnoresInvertColors != newViewProps.accessibilityIgnoresInvertColors) {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
    if (@available(iOS 11.0, *)) {
      self.accessibilityIgnoresInvertColors = newViewProps.accessibilityIgnoresInvertColors;
    }
#endif
  }

  _needsInvalidateLayer = _needsInvalidateLayer || needsInvalidateLayer;

  _props = std::static_pointer_cast<ViewProps const>(props);
}

- (void)updateEventEmitter:(EventEmitter::Shared const &)eventEmitter
{
  assert(std::dynamic_pointer_cast<ViewEventEmitter const>(eventEmitter));
  _eventEmitter = std::static_pointer_cast<ViewEventEmitter const>(eventEmitter);
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  // Using stored `_layoutMetrics` as `oldLayoutMetrics` here to avoid
  // re-applying individual sub-values which weren't changed.
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:_layoutMetrics];

  _layoutMetrics = layoutMetrics;
  _needsInvalidateLayer = YES;

  if (_borderLayer) {
    _borderLayer.frame = self.layer.bounds;
  }

  if (_contentView) {
    _contentView.frame = ABI42_0_0RCTCGRectFromRect(_layoutMetrics.getContentFrame());
  }
}

- (void)finalizeUpdates:(ABI42_0_0RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  if (!_needsInvalidateLayer) {
    return;
  }

  _needsInvalidateLayer = NO;
  [self invalidateLayer];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _eventEmitter.reset();
}

- (UIView *)betterHitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  // This is a classic textbook implementation of `hitTest:` with a couple of improvements:
  //   * It does not stop algorithm if some touch is outside the view
  //     which does not have `clipToBounds` enabled.
  //   * Taking `layer.zIndex` field into an account is not required because
  //     lists of `ShadowView`s are already sorted based on `zIndex` prop.

  if (!self.userInteractionEnabled || self.hidden || self.alpha < 0.01) {
    return nil;
  }

  BOOL isPointInside = [self pointInside:point withEvent:event];

  if (self.clipsToBounds && !isPointInside) {
    return nil;
  }

  for (UIView *subview in [self.subviews reverseObjectEnumerator]) {
    UIView *hitView = [subview hitTest:[subview convertPoint:point fromView:self] withEvent:event];
    if (hitView) {
      return hitView;
    }
  }

  return isPointInside ? self : nil;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  switch (_props->pointerEvents) {
    case PointerEventsMode::Auto:
      return [self betterHitTest:point withEvent:event];
    case PointerEventsMode::None:
      return nil;
    case PointerEventsMode::BoxOnly:
      return [self pointInside:point withEvent:event] ? self : nil;
    case PointerEventsMode::BoxNone:
      UIView *view = [self betterHitTest:point withEvent:event];
      return view != self ? view : nil;
  }
}

static ABI42_0_0RCTCornerRadii ABI42_0_0RCTCornerRadiiFromBorderRadii(BorderRadii borderRadii)
{
  return ABI42_0_0RCTCornerRadii{.topLeft = (CGFloat)borderRadii.topLeft,
                        .topRight = (CGFloat)borderRadii.topRight,
                        .bottomLeft = (CGFloat)borderRadii.bottomLeft,
                        .bottomRight = (CGFloat)borderRadii.bottomRight};
}

static ABI42_0_0RCTBorderColors ABI42_0_0RCTBorderColorsFromBorderColors(BorderColors borderColors)
{
  return ABI42_0_0RCTBorderColors{.left = ABI42_0_0RCTCGColorRefUnretainedFromSharedColor(borderColors.left),
                         .top = ABI42_0_0RCTCGColorRefUnretainedFromSharedColor(borderColors.top),
                         .bottom = ABI42_0_0RCTCGColorRefUnretainedFromSharedColor(borderColors.bottom),
                         .right = ABI42_0_0RCTCGColorRefUnretainedFromSharedColor(borderColors.right)};
}

static ABI42_0_0RCTBorderStyle ABI42_0_0RCTBorderStyleFromBorderStyle(BorderStyle borderStyle)
{
  switch (borderStyle) {
    case BorderStyle::Solid:
      return ABI42_0_0RCTBorderStyleSolid;
    case BorderStyle::Dotted:
      return ABI42_0_0RCTBorderStyleDotted;
    case BorderStyle::Dashed:
      return ABI42_0_0RCTBorderStyleDashed;
  }
}

- (void)invalidateLayer
{
  CALayer *layer = self.layer;

  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  auto const borderMetrics = _props->resolveBorderMetrics(_layoutMetrics);

  // Stage 1. Shadow Path
  BOOL const layerHasShadow = layer.shadowOpacity > 0 && CGColorGetAlpha(layer.shadowColor) > 0;
  if (layerHasShadow) {
    if (CGColorGetAlpha(_backgroundColor.CGColor) > 0.999) {
      // If view has a solid background color, calculate shadow path from border.
      ABI42_0_0RCTCornerInsets const cornerInsets =
          ABI42_0_0RCTGetCornerInsets(ABI42_0_0RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero);
      CGPathRef shadowPath = ABI42_0_0RCTPathCreateWithRoundedRect(self.bounds, cornerInsets, nil);
      layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);
    } else {
      // Can't accurately calculate box shadow, so fall back to pixel-based shadow.
      layer.shadowPath = nil;
    }
  } else {
    layer.shadowPath = nil;
  }

  // Stage 2. Border Rendering
  bool const useCoreAnimationBorderRendering =
      borderMetrics.borderColors.isUniform() && borderMetrics.borderWidths.isUniform() &&
      borderMetrics.borderStyles.isUniform() && borderMetrics.borderRadii.isUniform() &&
      borderMetrics.borderStyles.left == BorderStyle::Solid &&
      (
          // iOS draws borders in front of the content whereas CSS draws them behind
          // the content. For this reason, only use iOS border drawing when clipping
          // or when the border is hidden.
          borderMetrics.borderWidths.left == 0 ||
          colorComponentsFromColor(borderMetrics.borderColors.left).alpha == 0 || self.clipsToBounds);

  if (useCoreAnimationBorderRendering) {
    layer.mask = nil;
    if (_borderLayer) {
      [_borderLayer removeFromSuperlayer];
      _borderLayer = nil;
    }

    layer.borderWidth = (CGFloat)borderMetrics.borderWidths.left;
    CGColorRef borderColor = ABI42_0_0RCTCGColorRefFromSharedColor(borderMetrics.borderColors.left);
    layer.borderColor = borderColor;
    CGColorRelease(borderColor);
    layer.cornerRadius = (CGFloat)borderMetrics.borderRadii.topLeft;
    layer.backgroundColor = _backgroundColor.CGColor;
  } else {
    if (!_borderLayer) {
      _borderLayer = [[CALayer alloc] init];
      _borderLayer.zPosition = -1024.0f;
      _borderLayer.frame = layer.bounds;
      _borderLayer.magnificationFilter = kCAFilterNearest;
      [layer addSublayer:_borderLayer];
    }

    layer.backgroundColor = nil;
    layer.borderWidth = 0;
    layer.borderColor = nil;
    layer.cornerRadius = 0;

    UIImage *image = ABI42_0_0RCTGetBorderImage(
        ABI42_0_0RCTBorderStyleFromBorderStyle(borderMetrics.borderStyles.left),
        layer.bounds.size,
        ABI42_0_0RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii),
        ABI42_0_0RCTUIEdgeInsetsFromEdgeInsets(borderMetrics.borderWidths),
        ABI42_0_0RCTBorderColorsFromBorderColors(borderMetrics.borderColors),
        _backgroundColor.CGColor,
        self.clipsToBounds);

    if (image == nil) {
      _borderLayer.contents = nil;
    } else {
      CGSize imageSize = image.size;
      UIEdgeInsets imageCapInsets = image.capInsets;
      CGRect contentsCenter =
          CGRect{CGPoint{imageCapInsets.left / imageSize.width, imageCapInsets.top / imageSize.height},
                 CGSize{(CGFloat)1.0 / imageSize.width, (CGFloat)1.0 / imageSize.height}};

      _borderLayer.contents = (id)image.CGImage;
      _borderLayer.contentsScale = image.scale;

      BOOL isResizable = !UIEdgeInsetsEqualToEdgeInsets(image.capInsets, UIEdgeInsetsZero);
      if (isResizable) {
        _borderLayer.contentsCenter = contentsCenter;
      } else {
        _borderLayer.contentsCenter = CGRect{CGPoint{0.0, 0.0}, CGSize{1.0, 1.0}};
      }
    }

    // Stage 2.5. Custom Clipping Mask
    CAShapeLayer *maskLayer = nil;
    CGFloat cornerRadius = 0;
    if (self.clipsToBounds) {
      if (borderMetrics.borderRadii.isUniform()) {
        // In this case we can simply use `cornerRadius` exclusively.
        cornerRadius = borderMetrics.borderRadii.topLeft;
      } else {
        // In this case we have to generate masking layer manually.
        CGPathRef path = ABI42_0_0RCTPathCreateWithRoundedRect(
            self.bounds,
            ABI42_0_0RCTGetCornerInsets(ABI42_0_0RCTCornerRadiiFromBorderRadii(borderMetrics.borderRadii), UIEdgeInsetsZero),
            nil);

        maskLayer = [CAShapeLayer layer];
        maskLayer.path = path;
        CGPathRelease(path);
      }
    }

    layer.cornerRadius = cornerRadius;
    layer.mask = maskLayer;
  }
}

#pragma mark - Accessibility

- (NSObject *)accessibilityElement
{
  return self;
}

static NSString *ABI42_0_0RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *result = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = subview.accessibilityLabel;
    if (!label) {
      label = ABI42_0_0RCTRecursiveAccessibilityLabel(subview);
    }
    if (label && label.length > 0) {
      if (result.length > 0) {
        [result appendString:@" "];
      }
      [result appendString:label];
    }
  }
  return result;
}

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if (label) {
    return label;
  }

  return ABI42_0_0RCTRecursiveAccessibilityLabel(self);
}

#pragma mark - Accessibility Events

- (NSArray<UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  auto const &accessibilityActions = _props->accessibilityActions;

  if (accessibilityActions.size() == 0) {
    return nil;
  }

  NSMutableArray<UIAccessibilityCustomAction *> *customActions = [NSMutableArray array];
  for (auto const &accessibilityAction : accessibilityActions) {
    [customActions
        addObject:[[UIAccessibilityCustomAction alloc] initWithName:ABI42_0_0RCTNSStringFromString(accessibilityAction)
                                                             target:self
                                                           selector:@selector(didActivateAccessibilityCustomAction:)]];
  }

  return [customActions copy];
}

- (BOOL)accessibilityActivate
{
  if (_eventEmitter && _props->onAccessibilityTap) {
    _eventEmitter->onAccessibilityTap();
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformMagicTap
{
  if (_eventEmitter && _props->onAccessibilityMagicTap) {
    _eventEmitter->onAccessibilityMagicTap();
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformEscape
{
  if (_eventEmitter && _props->onAccessibilityEscape) {
    _eventEmitter->onAccessibilityEscape();
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  if (_eventEmitter && _props->onAccessibilityAction) {
    _eventEmitter->onAccessibilityAction(ABI42_0_0RCTStringFromNSString(action.name));
    return YES;
  } else {
    return NO;
  }
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  return _eventEmitter;
}

- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN
{
  return ABI42_0_0RCTNSStringFromString([[self class] componentDescriptorProvider].name);
}

@end
