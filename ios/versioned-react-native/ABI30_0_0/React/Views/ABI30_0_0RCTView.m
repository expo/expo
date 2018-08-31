/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTView.h"

#import "ABI30_0_0RCTAutoInsetsProtocol.h"
#import "ABI30_0_0RCTBorderDrawing.h"
#import "ABI30_0_0RCTConvert.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTUtils.h"
#import "UIView+ReactABI30_0_0.h"
#import "ABI30_0_0RCTI18nUtil.h"

@implementation UIView (ABI30_0_0RCTViewUnmounting)

- (void)ReactABI30_0_0_remountAllSubviews
{
  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview ReactABI30_0_0_remountAllSubviews];
  }
}

- (void)ReactABI30_0_0_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // Even though we don't support subview unmounting
  // we do support clipsToBounds, so if that's enabled
  // we'll update the clipping

  if (self.clipsToBounds && self.subviews.count > 0) {
    clipRect = [clipView convertRect:clipRect toView:self];
    clipRect = CGRectIntersection(clipRect, self.bounds);
    clipView = self;
  }

  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview ReactABI30_0_0_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }
}

- (UIView *)ReactABI30_0_0_findClipView
{
  UIView *testView = self;
  UIView *clipView = nil;
  CGRect clipRect = self.bounds;
  // We will only look for a clipping view up the view hierarchy until we hit the root view.
  while (testView) {
    if (testView.clipsToBounds) {
      if (clipView) {
        CGRect testRect = [clipView convertRect:clipRect toView:testView];
        if (!CGRectContainsRect(testView.bounds, testRect)) {
          clipView = testView;
          clipRect = CGRectIntersection(testView.bounds, testRect);
        }
      } else {
        clipView = testView;
        clipRect = [self convertRect:self.bounds toView:clipView];
      }
    }
    if ([testView isReactABI30_0_0RootView]) {
      break;
    }
    testView = testView.superview;
  }
  return clipView ?: self.window;
}

@end

static NSString *ABI30_0_0RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = subview.accessibilityLabel;
    if (!label) {
      label = ABI30_0_0RCTRecursiveAccessibilityLabel(subview);
    }
    if (label && label.length > 0) {
      if (str.length > 0) {
        [str appendString:@" "];
      }
      [str appendString:label];
    }
  }
  return str;
}

@implementation ABI30_0_0RCTView
{
  UIColor *_backgroundColor;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _borderWidth = -1;
    _borderTopWidth = -1;
    _borderRightWidth = -1;
    _borderBottomWidth = -1;
    _borderLeftWidth = -1;
    _borderStartWidth = -1;
    _borderEndWidth = -1;
    _borderTopLeftRadius = -1;
    _borderTopRightRadius = -1;
    _borderTopStartRadius = -1;
    _borderTopEndRadius = -1;
    _borderBottomLeftRadius = -1;
    _borderBottomRightRadius = -1;
    _borderBottomStartRadius = -1;
    _borderBottomEndRadius = -1;
    _borderStyle = ABI30_0_0RCTBorderStyleSolid;
    _hitTestEdgeInsets = UIEdgeInsetsZero;

    _backgroundColor = super.backgroundColor;
  }

  return self;
}

ABI30_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:unused)

- (void)setReactABI30_0_0LayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if (_ReactABI30_0_0LayoutDirection != layoutDirection) {
    _ReactABI30_0_0LayoutDirection = layoutDirection;
    [self.layer setNeedsDisplay];
  }

  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
    self.semanticContentAttribute =
      layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight ?
        UISemanticContentAttributeForceLeftToRight :
        UISemanticContentAttributeForceRightToLeft;
  }
}

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if (label) {
    return label;
  }
  return ABI30_0_0RCTRecursiveAccessibilityLabel(self);
}

- (NSArray <UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  if (!_accessibilityActions.count) {
    return nil;
  }

  NSMutableArray *actions = [NSMutableArray array];
  for (NSString *action in _accessibilityActions) {
    [actions addObject:[[UIAccessibilityCustomAction alloc] initWithName:action
                                                                  target:self
                                                                selector:@selector(didActivateAccessibilityCustomAction:)]];
  }

  return [actions copy];
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  if (!_onAccessibilityAction) {
    return NO;
  }

  _onAccessibilityAction(@{
    @"action": action.name,
    @"target": self.ReactABI30_0_0Tag
  });

  return YES;
}

- (void)setPointerEvents:(ABI30_0_0RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != ABI30_0_0RCTPointerEventsNone);
  if (pointerEvents == ABI30_0_0RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO;
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if(!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  UIView *hitSubview = nil;
  BOOL isPointInside = [self pointInside:point withEvent:event];
  BOOL needsHitSubview = !(_pointerEvents == ABI30_0_0RCTPointerEventsNone || _pointerEvents == ABI30_0_0RCTPointerEventsBoxOnly);
  if (needsHitSubview && (![self clipsToBounds] || isPointInside)) {
    // Take z-index into account when calculating the touch target.
    NSArray<UIView *> *sortedSubviews = [self ReactABI30_0_0ZIndexSortedSubviews];

    // The default behaviour of UIKit is that if a view does not contain a point,
    // then no subviews will be returned from hit testing, even if they contain
    // the hit point. By doing hit testing directly on the subviews, we bypass
    // the strict containment policy (i.e., UIKit guarantees that every ancestor
    // of the hit view will return YES from -pointInside:withEvent:). See:
    //  - https://developer.apple.com/library/ios/qa/qa2013/qa1812.html
    for (UIView *subview in [sortedSubviews reverseObjectEnumerator]) {
      CGPoint convertedPoint = [subview convertPoint:point fromView:self];
      hitSubview = [subview hitTest:convertedPoint withEvent:event];
      if (hitSubview != nil) {
        break;
      }
    }
  }

  UIView *hitView = (isPointInside ? self : nil);

  switch (_pointerEvents) {
    case ABI30_0_0RCTPointerEventsNone:
      return nil;
    case ABI30_0_0RCTPointerEventsUnspecified:
      return hitSubview ?: hitView;
    case ABI30_0_0RCTPointerEventsBoxOnly:
      return hitView;
    case ABI30_0_0RCTPointerEventsBoxNone:
      return hitSubview;
    default:
      ABI30_0_0RCTLogError(@"Invalid pointer-events specified %lld on %@", (long long)_pointerEvents, self);
      return hitSubview ?: hitView;
  }
}

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  if (UIEdgeInsetsEqualToEdgeInsets(self.hitTestEdgeInsets, UIEdgeInsetsZero)) {
    return [super pointInside:point withEvent:event];
  }
  CGRect hitFrame = UIEdgeInsetsInsetRect(self.bounds, self.hitTestEdgeInsets);
  return CGRectContainsPoint(hitFrame, point);
}

- (UIView *)ReactABI30_0_0AccessibilityElement
{
  return self;
}

- (BOOL)isAccessibilityElement
{
  if (self.ReactABI30_0_0AccessibilityElement == self) {
    return [super isAccessibilityElement];
  }

  return NO;
}

- (BOOL)accessibilityActivate
{
  if (_onAccessibilityTap) {
    _onAccessibilityTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformMagicTap
{
  if (_onMagicTap) {
    _onMagicTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  NSRange semicolonRange = [superDescription rangeOfString:@";"];
  NSString *replacement = [NSString stringWithFormat:@"; ReactABI30_0_0Tag: %@;", self.ReactABI30_0_0Tag];
  return [superDescription stringByReplacingCharactersInRange:semicolonRange withString:replacement];
}

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(UIView<ABI30_0_0RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = [self contentInsetsForView:parentView];
    baseInset.top += autoInset.top;
    baseInset.bottom += autoInset.bottom;
    baseInset.left += autoInset.left;
    baseInset.right += autoInset.right;
  }
  scrollView.contentInset = baseInset;
  scrollView.scrollIndicatorInsets = baseInset;

  if (updateOffset) {
    // If we're adjusting the top inset, then let's also adjust the contentOffset so that the view
    // elements above the top guide do not cover the content.
    // This is generally only needed when your views are initially laid out, for
    // manual changes to contentOffset, you can optionally disable this step
    CGFloat currentInsetTop = scrollView.contentInset.top;
    if (currentInsetTop != previousInsetTop) {
      contentOffset.y -= (currentInsetTop - previousInsetTop);
      scrollView.contentOffset = contentOffset;
    }
  }
}

+ (UIEdgeInsets)contentInsetsForView:(UIView *)view
{
  while (view) {
    UIViewController *controller = view.ReactABI30_0_0ViewController;
    if (controller) {
      return (UIEdgeInsets){
        controller.topLayoutGuide.length, 0,
        controller.bottomLayoutGuide.length, 0
      };
    }
    view = view.superview;
  }
  return UIEdgeInsetsZero;
}

#pragma mark - View unmounting

- (void)ReactABI30_0_0_remountAllSubviews
{
  if (_removeClippedSubviews) {
    for (UIView *view in self.ReactABI30_0_0Subviews) {
      if (view.superview != self) {
        [self addSubview:view];
        [view ReactABI30_0_0_remountAllSubviews];
      }
    }
  } else {
    // If _removeClippedSubviews is false, we must already be showing all subviews
    [super ReactABI30_0_0_remountAllSubviews];
  }
}

- (void)ReactABI30_0_0_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // TODO (#5906496): for scrollviews (the primary use-case) we could
  // optimize this by only doing a range check along the scroll axis,
  // instead of comparing the whole frame

  if (!_removeClippedSubviews) {
    // Use default behavior if unmounting is disabled
    return [super ReactABI30_0_0_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }

  if (self.ReactABI30_0_0Subviews.count == 0) {
    // Do nothing if we have no subviews
    return;
  }

  if (CGSizeEqualToSize(self.bounds.size, CGSizeZero)) {
    // Do nothing if layout hasn't happened yet
    return;
  }

  // Convert clipping rect to local coordinates
  clipRect = [clipView convertRect:clipRect toView:self];
  clipRect = CGRectIntersection(clipRect, self.bounds);
  clipView = self;

  // Mount / unmount views
  for (UIView *view in self.ReactABI30_0_0Subviews) {
    if (!CGSizeEqualToSize(CGRectIntersection(clipRect, view.frame).size, CGSizeZero)) {
      // View is at least partially visible, so remount it if unmounted
      [self addSubview:view];

      // Then test its subviews
      if (CGRectContainsRect(clipRect, view.frame)) {
        // View is fully visible, so remount all subviews
        [view ReactABI30_0_0_remountAllSubviews];
      } else {
        // View is partially visible, so update clipped subviews
        [view ReactABI30_0_0_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
      }

    } else if (view.superview) {

      // View is completely outside the clipRect, so unmount it
      [view removeFromSuperview];
    }
  }
}

- (void)setRemoveClippedSubviews:(BOOL)removeClippedSubviews
{
  if (!removeClippedSubviews && _removeClippedSubviews) {
    [self ReactABI30_0_0_remountAllSubviews];
  }
  _removeClippedSubviews = removeClippedSubviews;
}

- (void)didUpdateReactABI30_0_0Subviews
{
  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  } else {
    [super didUpdateReactABI30_0_0Subviews];
  }
}

- (void)updateClippedSubviews
{
  // Find a suitable view to use for clipping
  UIView *clipView = [self ReactABI30_0_0_findClipView];
  if (clipView) {
    [self ReactABI30_0_0_updateClippedSubviewsWithClipRect:clipView.bounds relativeToView:clipView];
  }
}

- (void)layoutSubviews
{
  // TODO (#5906496): this a nasty performance drain, but necessary
  // to prevent gaps appearing when the loading spinner disappears.
  // We might be able to fix this another way by triggering a call
  // to updateClippedSubviews manually after loading

  [super layoutSubviews];

  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  }
}

#pragma mark - Borders

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  if ([_backgroundColor isEqual:backgroundColor]) {
    return;
  }

  _backgroundColor = backgroundColor;
  [self.layer setNeedsDisplay];
}

static CGFloat ABI30_0_0RCTDefaultIfNegativeTo(CGFloat defaultValue, CGFloat x) {
  return x >= 0 ? x : defaultValue;
};

- (UIEdgeInsets)bordersAsInsets
{
  const CGFloat borderWidth = MAX(0, _borderWidth);
  const BOOL isRTL = _ReactABI30_0_0LayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat borderStartWidth = ABI30_0_0RCTDefaultIfNegativeTo(_borderLeftWidth, _borderStartWidth);
    const CGFloat borderEndWidth = ABI30_0_0RCTDefaultIfNegativeTo(_borderRightWidth, _borderEndWidth);

    const CGFloat directionAwareBorderLeftWidth = isRTL ? borderEndWidth : borderStartWidth;
    const CGFloat directionAwareBorderRightWidth = isRTL ? borderStartWidth : borderEndWidth;

    return (UIEdgeInsets) {
      ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
      ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderLeftWidth),
      ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
      ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderRightWidth),
    };
  }

  const CGFloat directionAwareBorderLeftWidth = isRTL ? _borderEndWidth : _borderStartWidth;
  const CGFloat directionAwareBorderRightWidth = isRTL ? _borderStartWidth : _borderEndWidth;

  return (UIEdgeInsets) {
    ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
    ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, ABI30_0_0RCTDefaultIfNegativeTo(_borderLeftWidth, directionAwareBorderLeftWidth)),
    ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
    ABI30_0_0RCTDefaultIfNegativeTo(borderWidth, ABI30_0_0RCTDefaultIfNegativeTo(_borderRightWidth, directionAwareBorderRightWidth)),
  };
}

- (ABI30_0_0RCTCornerRadii)cornerRadii
{
  const BOOL isRTL = _ReactABI30_0_0LayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  const CGFloat radius = MAX(0, _borderRadius);

  CGFloat topLeftRadius;
  CGFloat topRightRadius;
  CGFloat bottomLeftRadius;
  CGFloat bottomRightRadius;

  if ([[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat topStartRadius = ABI30_0_0RCTDefaultIfNegativeTo(_borderTopLeftRadius, _borderTopStartRadius);
    const CGFloat topEndRadius = ABI30_0_0RCTDefaultIfNegativeTo(_borderTopRightRadius, _borderTopEndRadius);
    const CGFloat bottomStartRadius = ABI30_0_0RCTDefaultIfNegativeTo(_borderBottomLeftRadius, _borderBottomStartRadius);
    const CGFloat bottomEndRadius = ABI30_0_0RCTDefaultIfNegativeTo(_borderBottomRightRadius, _borderBottomEndRadius);

    const CGFloat directionAwareTopLeftRadius = isRTL ? topEndRadius : topStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? topStartRadius : topEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? bottomEndRadius : bottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? bottomStartRadius : bottomEndRadius;

    topLeftRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, directionAwareTopLeftRadius);
    topRightRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, directionAwareTopRightRadius);
    bottomLeftRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, directionAwareBottomLeftRadius);
    bottomRightRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, directionAwareBottomRightRadius);
  } else {
    const CGFloat directionAwareTopLeftRadius = isRTL ? _borderTopEndRadius : _borderTopStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? _borderTopStartRadius : _borderTopEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? _borderBottomEndRadius : _borderBottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? _borderBottomStartRadius : _borderBottomEndRadius;

    topLeftRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, ABI30_0_0RCTDefaultIfNegativeTo(_borderTopLeftRadius, directionAwareTopLeftRadius));
    topRightRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, ABI30_0_0RCTDefaultIfNegativeTo(_borderTopRightRadius, directionAwareTopRightRadius));
    bottomLeftRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, ABI30_0_0RCTDefaultIfNegativeTo(_borderBottomLeftRadius, directionAwareBottomLeftRadius));
    bottomRightRadius = ABI30_0_0RCTDefaultIfNegativeTo(radius, ABI30_0_0RCTDefaultIfNegativeTo(_borderBottomRightRadius, directionAwareBottomRightRadius));
  }

  // Get scale factors required to prevent radii from overlapping
  const CGSize size = self.bounds.size;
  const CGFloat topScaleFactor = ABI30_0_0RCTZeroIfNaN(MIN(1, size.width / (topLeftRadius + topRightRadius)));
  const CGFloat bottomScaleFactor = ABI30_0_0RCTZeroIfNaN(MIN(1, size.width / (bottomLeftRadius + bottomRightRadius)));
  const CGFloat rightScaleFactor = ABI30_0_0RCTZeroIfNaN(MIN(1, size.height / (topRightRadius + bottomRightRadius)));
  const CGFloat leftScaleFactor = ABI30_0_0RCTZeroIfNaN(MIN(1, size.height / (topLeftRadius + bottomLeftRadius)));

  // Return scaled radii
  return (ABI30_0_0RCTCornerRadii){
    topLeftRadius * MIN(topScaleFactor, leftScaleFactor),
    topRightRadius * MIN(topScaleFactor, rightScaleFactor),
    bottomLeftRadius * MIN(bottomScaleFactor, leftScaleFactor),
    bottomRightRadius * MIN(bottomScaleFactor, rightScaleFactor),
  };
}

- (ABI30_0_0RCTBorderColors)borderColors
{
  const BOOL isRTL = _ReactABI30_0_0LayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGColorRef borderStartColor = _borderStartColor ?: _borderLeftColor;
    const CGColorRef borderEndColor = _borderEndColor ?: _borderRightColor;

    const CGColorRef directionAwareBorderLeftColor = isRTL ? borderEndColor : borderStartColor;
    const CGColorRef directionAwareBorderRightColor = isRTL ? borderStartColor : borderEndColor;

    return (ABI30_0_0RCTBorderColors){
      _borderTopColor ?: _borderColor,
      directionAwareBorderLeftColor ?: _borderColor,
      _borderBottomColor ?: _borderColor,
      directionAwareBorderRightColor ?: _borderColor,
    };
  }

  const CGColorRef directionAwareBorderLeftColor = isRTL ? _borderEndColor : _borderStartColor;
  const CGColorRef directionAwareBorderRightColor = isRTL ? _borderStartColor : _borderEndColor;

  return (ABI30_0_0RCTBorderColors){
    _borderTopColor ?: _borderColor,
    directionAwareBorderLeftColor ?: _borderLeftColor ?: _borderColor,
    _borderBottomColor ?: _borderColor,
    directionAwareBorderRightColor ?: _borderRightColor ?: _borderColor,
  };
}

- (void)ReactABI30_0_0SetFrame:(CGRect)frame
{
  // If frame is zero, or below the threshold where the border radii can
  // be rendered as a stretchable image, we'll need to re-render.
  // TODO: detect up-front if re-rendering is necessary
  CGSize oldSize = self.bounds.size;
  [super ReactABI30_0_0SetFrame:frame];
  if (!CGSizeEqualToSize(self.bounds.size, oldSize)) {
    [self.layer setNeedsDisplay];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  ABI30_0_0RCTUpdateShadowPathForView(self);

  const ABI30_0_0RCTCornerRadii cornerRadii = [self cornerRadii];
  const UIEdgeInsets borderInsets = [self bordersAsInsets];
  const ABI30_0_0RCTBorderColors borderColors = [self borderColors];

  BOOL useIOSBorderRendering =
  !ABI30_0_0RCTRunningInTestEnvironment() &&
  ABI30_0_0RCTCornerRadiiAreEqual(cornerRadii) &&
  ABI30_0_0RCTBorderInsetsAreEqual(borderInsets) &&
  ABI30_0_0RCTBorderColorsAreEqual(borderColors) &&
  _borderStyle == ABI30_0_0RCTBorderStyleSolid &&

  // iOS draws borders in front of the content whereas CSS draws them behind
  // the content. For this reason, only use iOS border drawing when clipping
  // or when the border is hidden.

  (borderInsets.top == 0 || (borderColors.top && CGColorGetAlpha(borderColors.top) == 0) || self.clipsToBounds);

  // iOS clips to the outside of the border, but CSS clips to the inside. To
  // solve this, we'll need to add a container view inside the main view to
  // correctly clip the subviews.

  if (useIOSBorderRendering) {
    layer.cornerRadius = cornerRadii.topLeft;
    layer.borderColor = borderColors.left;
    layer.borderWidth = borderInsets.left;
    layer.backgroundColor = _backgroundColor.CGColor;
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    layer.mask = nil;
    return;
  }

  UIImage *image = ABI30_0_0RCTGetBorderImage(_borderStyle,
                                     layer.bounds.size,
                                     cornerRadii,
                                     borderInsets,
                                     borderColors,
                                     _backgroundColor.CGColor,
                                     self.clipsToBounds);

  layer.backgroundColor = NULL;

  if (image == nil) {
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    return;
  }

  CGRect contentsCenter = ({
    CGSize size = image.size;
    UIEdgeInsets insets = image.capInsets;
    CGRectMake(
      insets.left / size.width,
      insets.top / size.height,
      1.0 / size.width,
      1.0 / size.height
    );
  });

  if (ABI30_0_0RCTRunningInTestEnvironment()) {
    const CGSize size = self.bounds.size;
    UIGraphicsBeginImageContextWithOptions(size, NO, image.scale);
    [image drawInRect:(CGRect){CGPointZero, size}];
    image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    contentsCenter = CGRectMake(0, 0, 1, 1);
  }

  layer.contents = (id)image.CGImage;
  layer.contentsScale = image.scale;
  layer.needsDisplayOnBoundsChange = YES;
  layer.magnificationFilter = kCAFilterNearest;

  const BOOL isResizable = !UIEdgeInsetsEqualToEdgeInsets(image.capInsets, UIEdgeInsetsZero);
  if (isResizable) {
    layer.contentsCenter = contentsCenter;
  } else {
    layer.contentsCenter = CGRectMake(0.0, 0.0, 1.0, 1.0);
  }

  [self updateClippingForLayer:layer];
}

static BOOL ABI30_0_0RCTLayerHasShadow(CALayer *layer)
{
  return layer.shadowOpacity * CGColorGetAlpha(layer.shadowColor) > 0;
}

static void ABI30_0_0RCTUpdateShadowPathForView(ABI30_0_0RCTView *view)
{
  if (ABI30_0_0RCTLayerHasShadow(view.layer)) {
    if (CGColorGetAlpha(view.backgroundColor.CGColor) > 0.999) {

      // If view has a solid background color, calculate shadow path from border
      const ABI30_0_0RCTCornerRadii cornerRadii = [view cornerRadii];
      const ABI30_0_0RCTCornerInsets cornerInsets = ABI30_0_0RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero);
      CGPathRef shadowPath = ABI30_0_0RCTPathCreateWithRoundedRect(view.bounds, cornerInsets, NULL);
      view.layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);

    } else {

      // Can't accurately calculate box shadow, so fall back to pixel-based shadow
      view.layer.shadowPath = nil;

      ABI30_0_0RCTLogAdvice(@"View #%@ of type %@ has a shadow set but cannot calculate "
        "shadow efficiently. Consider setting a background color to "
        "fix this, or apply the shadow to a more specific component.",
        view.ReactABI30_0_0Tag, [view class]);
    }
  }
}

- (void)updateClippingForLayer:(CALayer *)layer
{
  CALayer *mask = nil;
  CGFloat cornerRadius = 0;

  if (self.clipsToBounds) {

    const ABI30_0_0RCTCornerRadii cornerRadii = [self cornerRadii];
    if (ABI30_0_0RCTCornerRadiiAreEqual(cornerRadii)) {

      cornerRadius = cornerRadii.topLeft;

    } else {

      CAShapeLayer *shapeLayer = [CAShapeLayer layer];
      CGPathRef path = ABI30_0_0RCTPathCreateWithRoundedRect(self.bounds, ABI30_0_0RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL);
      shapeLayer.path = path;
      CGPathRelease(path);
      mask = shapeLayer;
    }
  }

  layer.cornerRadius = cornerRadius;
  layer.mask = mask;
}

#pragma mark Border Color

#define setBorderColor(side)                                \
  - (void)setBorder##side##Color:(CGColorRef)color          \
  {                                                         \
    if (CGColorEqualToColor(_border##side##Color, color)) { \
      return;                                               \
    }                                                       \
    CGColorRelease(_border##side##Color);                   \
    _border##side##Color = CGColorRetain(color);            \
    [self.layer setNeedsDisplay];                           \
  }

setBorderColor()
setBorderColor(Top)
setBorderColor(Right)
setBorderColor(Bottom)
setBorderColor(Left)
setBorderColor(Start)
setBorderColor(End)

#pragma mark - Border Width

#define setBorderWidth(side)                    \
  - (void)setBorder##side##Width:(CGFloat)width \
  {                                             \
    if (_border##side##Width == width) {        \
      return;                                   \
    }                                           \
    _border##side##Width = width;               \
    [self.layer setNeedsDisplay];               \
  }

setBorderWidth()
setBorderWidth(Top)
setBorderWidth(Right)
setBorderWidth(Bottom)
setBorderWidth(Left)
setBorderWidth(Start)
setBorderWidth(End)

#pragma mark - Border Radius

#define setBorderRadius(side)                     \
  - (void)setBorder##side##Radius:(CGFloat)radius \
  {                                               \
    if (_border##side##Radius == radius) {        \
      return;                                     \
    }                                             \
    _border##side##Radius = radius;               \
    [self.layer setNeedsDisplay];                 \
  }

setBorderRadius()
setBorderRadius(TopLeft)
setBorderRadius(TopRight)
setBorderRadius(TopStart)
setBorderRadius(TopEnd)
setBorderRadius(BottomLeft)
setBorderRadius(BottomRight)
setBorderRadius(BottomStart)
setBorderRadius(BottomEnd)

#pragma mark - Border Style

#define setBorderStyle(side)                           \
  - (void)setBorder##side##Style:(ABI30_0_0RCTBorderStyle)style \
  {                                                    \
    if (_border##side##Style == style) {               \
      return;                                          \
    }                                                  \
    _border##side##Style = style;                      \
    [self.layer setNeedsDisplay];                      \
  }

setBorderStyle()

- (void)dealloc
{
  CGColorRelease(_borderColor);
  CGColorRelease(_borderTopColor);
  CGColorRelease(_borderRightColor);
  CGColorRelease(_borderBottomColor);
  CGColorRelease(_borderLeftColor);
  CGColorRelease(_borderStartColor);
  CGColorRelease(_borderEndColor);
}

@end
