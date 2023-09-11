/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTView.h"

#import <ABI47_0_0React/ABI47_0_0RCTMockDef.h>

#import "ABI47_0_0RCTAutoInsetsProtocol.h"
#import "ABI47_0_0RCTBorderDrawing.h"
#import "ABI47_0_0RCTI18nUtil.h"
#import "ABI47_0_0RCTLog.h"
#import "ABI47_0_0RCTViewUtils.h"
#import "ABI47_0_0UIView+React.h"

ABI47_0_0RCT_MOCK_DEF(ABI47_0_0RCTView, ABI47_0_0RCTContentInsets);
#define ABI47_0_0RCTContentInsets ABI47_0_0RCT_MOCK_USE(ABI47_0_0RCTView, ABI47_0_0RCTContentInsets)

UIAccessibilityTraits const ABI47_0_0SwitchAccessibilityTrait = 0x20000000000001;

@implementation UIView (ABI47_0_0RCTViewUnmounting)

- (void)ABI47_0_0React_remountAllSubviews
{
  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview ABI47_0_0React_remountAllSubviews];
  }
}

- (void)ABI47_0_0React_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
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
    [subview ABI47_0_0React_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }
}

- (UIView *)ABI47_0_0React_findClipView
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
    if ([testView isABI47_0_0ReactRootView]) {
      break;
    }
    testView = testView.superview;
  }
  return clipView ?: self.window;
}

@end

static NSString *ABI47_0_0RCTRecursiveAccessibilityLabel(UIView *view)
{
  NSMutableString *str = [NSMutableString stringWithString:@""];
  for (UIView *subview in view.subviews) {
    NSString *label = subview.accessibilityLabel;
    if (!label) {
      label = ABI47_0_0RCTRecursiveAccessibilityLabel(subview);
    }
    if (label && label.length > 0) {
      if (str.length > 0) {
        [str appendString:@" "];
      }
      [str appendString:label];
    }
  }
  return str.length == 0 ? nil : str;
}

@implementation ABI47_0_0RCTView {
  UIColor *_backgroundColor;
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsNameMap;
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsLabelMap;
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
    _borderStyle = ABI47_0_0RCTBorderStyleSolid;
    _hitTestEdgeInsets = UIEdgeInsetsZero;

    _backgroundColor = super.backgroundColor;
  }

  return self;
}

ABI47_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : unused)

- (void)setABI47_0_0ReactLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if (_ABI47_0_0ReactLayoutDirection != layoutDirection) {
    _ABI47_0_0ReactLayoutDirection = layoutDirection;
    [self.layer setNeedsDisplay];
  }

  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
    self.semanticContentAttribute = layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight
        ? UISemanticContentAttributeForceLeftToRight
        : UISemanticContentAttributeForceRightToLeft;
  }
}

#pragma mark - Hit Testing

- (void)setPointerEvents:(ABI47_0_0RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != ABI47_0_0RCTPointerEventsNone);
  if (pointerEvents == ABI47_0_0RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO;
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if (!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  UIView *hitSubview = nil;
  BOOL isPointInside = [self pointInside:point withEvent:event];
  BOOL needsHitSubview = !(_pointerEvents == ABI47_0_0RCTPointerEventsNone || _pointerEvents == ABI47_0_0RCTPointerEventsBoxOnly);
  if (needsHitSubview && (![self clipsToBounds] || isPointInside)) {
    // Take z-index into account when calculating the touch target.
    NSArray<UIView *> *sortedSubviews = [self ABI47_0_0ReactZIndexSortedSubviews];

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
    case ABI47_0_0RCTPointerEventsNone:
      return nil;
    case ABI47_0_0RCTPointerEventsUnspecified:
      return hitSubview ?: hitView;
    case ABI47_0_0RCTPointerEventsBoxOnly:
      return hitView;
    case ABI47_0_0RCTPointerEventsBoxNone:
      return hitSubview;
    default:
      ABI47_0_0RCTLogError(@"Invalid pointer-events specified %lld on %@", (long long)_pointerEvents, self);
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

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if (label) {
    return label;
  }
  return ABI47_0_0RCTRecursiveAccessibilityLabel(self);
}

- (NSArray<UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  if (!self.accessibilityActions.count) {
    return nil;
  }

  accessibilityActionsNameMap = [NSMutableDictionary new];
  accessibilityActionsLabelMap = [NSMutableDictionary new];
  NSMutableArray *actions = [NSMutableArray array];
  for (NSDictionary *action in self.accessibilityActions) {
    if (action[@"name"]) {
      accessibilityActionsNameMap[action[@"name"]] = action;
    }
    if (action[@"label"]) {
      accessibilityActionsLabelMap[action[@"label"]] = action;
      [actions addObject:[[UIAccessibilityCustomAction alloc]
                             initWithName:action[@"label"]
                                   target:self
                                 selector:@selector(didActivateAccessibilityCustomAction:)]];
    }
  }

  return [actions copy];
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  if (!_onAccessibilityAction || !accessibilityActionsLabelMap) {
    return NO;
  }
  // iOS defines the name as the localized label, so use our map to convert this back to the non-localized action name
  // when passing to JS. This allows for standard action names across platforms.
  NSDictionary *actionObject = accessibilityActionsLabelMap[action.name];
  if (actionObject) {
    _onAccessibilityAction(@{@"actionName" : actionObject[@"name"], @"actionTarget" : self.ABI47_0_0ReactTag});
  }
  return YES;
}

- (NSString *)accessibilityValue
{
  static dispatch_once_t onceToken;
  static NSDictionary<NSString *, NSString *> *rolesAndStatesDescription = nil;

  dispatch_once(&onceToken, ^{
    NSString *bundlePath = [[NSBundle mainBundle] pathForResource:@"AccessibilityResources" ofType:@"bundle"];
    NSBundle *bundle = [NSBundle bundleWithPath:bundlePath];

    if (bundle) {
      NSURL *url = [bundle URLForResource:@"Localizable" withExtension:@"strings"];
      rolesAndStatesDescription = [NSDictionary dictionaryWithContentsOfURL:url error:nil];
    }
    if (rolesAndStatesDescription == nil) {
      // Falling back to hardcoded English list.
      NSLog(@"Cannot load localized accessibility strings.");
      rolesAndStatesDescription = @{
        @"alert" : @"alert",
        @"checkbox" : @"checkbox",
        @"combobox" : @"combo box",
        @"menu" : @"menu",
        @"menubar" : @"menu bar",
        @"menuitem" : @"menu item",
        @"progressbar" : @"progress bar",
        @"radio" : @"radio button",
        @"radiogroup" : @"radio group",
        @"scrollbar" : @"scroll bar",
        @"spinbutton" : @"spin button",
        @"switch" : @"switch",
        @"tab" : @"tab",
        @"tablist" : @"tab list",
        @"timer" : @"timer",
        @"toolbar" : @"tool bar",
        @"checked" : @"checked",
        @"unchecked" : @"not checked",
        @"busy" : @"busy",
        @"expanded" : @"expanded",
        @"collapsed" : @"collapsed",
        @"mixed" : @"mixed",
      };
    }
  });

  // Handle Switch.
  if ((self.accessibilityTraits & ABI47_0_0SwitchAccessibilityTrait) == ABI47_0_0SwitchAccessibilityTrait) {
    for (NSString *state in self.accessibilityState) {
      id val = self.accessibilityState[state];
      if (!val) {
        continue;
      }
      if ([state isEqualToString:@"checked"] && [val isKindOfClass:[NSNumber class]]) {
        return [val boolValue] ? @"1" : @"0";
      }
    }
  }
  NSMutableArray *valueComponents = [NSMutableArray new];
  NSString *roleDescription = self.accessibilityRole ? rolesAndStatesDescription[self.accessibilityRole] : nil;
  if (roleDescription) {
    [valueComponents addObject:roleDescription];
  }

  // Handle states which haven't already been handled in ABI47_0_0RCTViewManager.
  for (NSString *state in self.accessibilityState) {
    id val = self.accessibilityState[state];
    if (!val) {
      continue;
    }
    if ([state isEqualToString:@"checked"]) {
      if ([val isKindOfClass:[NSNumber class]]) {
        [valueComponents addObject:rolesAndStatesDescription[[val boolValue] ? @"checked" : @"unchecked"]];
      } else if ([val isKindOfClass:[NSString class]] && [val isEqualToString:@"mixed"]) {
        [valueComponents addObject:rolesAndStatesDescription[@"mixed"]];
      }
    }
    if ([state isEqualToString:@"expanded"] && [val isKindOfClass:[NSNumber class]]) {
      [valueComponents addObject:rolesAndStatesDescription[[val boolValue] ? @"expanded" : @"collapsed"]];
    }
    if ([state isEqualToString:@"busy"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      [valueComponents addObject:rolesAndStatesDescription[@"busy"]];
    }
  }

  // Handle accessibilityValue.
  if (self.accessibilityValueInternal) {
    id min = self.accessibilityValueInternal[@"min"];
    id now = self.accessibilityValueInternal[@"now"];
    id max = self.accessibilityValueInternal[@"max"];
    id text = self.accessibilityValueInternal[@"text"];
    if (text && [text isKindOfClass:[NSString class]]) {
      [valueComponents addObject:text];
    } else if (
        [min isKindOfClass:[NSNumber class]] && [now isKindOfClass:[NSNumber class]] &&
        [max isKindOfClass:[NSNumber class]] && ([min intValue] < [max intValue]) &&
        ([min intValue] <= [now intValue] && [now intValue] <= [max intValue])) {
      int val = ([now intValue] * 100) / ([max intValue] - [min intValue]);
      [valueComponents addObject:[NSString stringWithFormat:@"%d percent", val]];
    }
  }

  if (valueComponents.count > 0) {
    return [valueComponents componentsJoinedByString:@", "];
  }
  return nil;
}

- (UIView *)ABI47_0_0ReactAccessibilityElement
{
  return self;
}

- (BOOL)isAccessibilityElement
{
  if (self.ABI47_0_0ReactAccessibilityElement == self) {
    return [super isAccessibilityElement];
  }

  return NO;
}

- (BOOL)performAccessibilityAction:(NSString *)name
{
  if (_onAccessibilityAction && accessibilityActionsNameMap[name]) {
    _onAccessibilityAction(@{@"actionName" : name, @"actionTarget" : self.ABI47_0_0ReactTag});
    return YES;
  }
  return NO;
}

- (BOOL)accessibilityActivate
{
  if ([self performAccessibilityAction:@"activate"]) {
    return YES;
  } else if (_onAccessibilityTap) {
    _onAccessibilityTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformMagicTap
{
  if ([self performAccessibilityAction:@"magicTap"]) {
    return YES;
  } else if (_onMagicTap) {
    _onMagicTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformEscape
{
  if ([self performAccessibilityAction:@"escape"]) {
    return YES;
  } else if (_onAccessibilityEscape) {
    _onAccessibilityEscape(nil);
    return YES;
  } else {
    return NO;
  }
}

- (void)accessibilityIncrement
{
  [self performAccessibilityAction:@"increment"];
}

- (void)accessibilityDecrement
{
  [self performAccessibilityAction:@"decrement"];
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  NSRange semicolonRange = [superDescription rangeOfString:@";"];
  NSString *replacement = [NSString stringWithFormat:@"; ABI47_0_0ReactTag: %@;", self.ABI47_0_0ReactTag];
  return [superDescription stringByReplacingCharactersInRange:semicolonRange withString:replacement];
}

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(UIView<ABI47_0_0RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = ABI47_0_0RCTContentInsets(parentView);
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

#pragma mark - View Unmounting

- (void)ABI47_0_0React_remountAllSubviews
{
  if (_removeClippedSubviews) {
    for (UIView *view in self.ABI47_0_0ReactSubviews) {
      if (view.superview != self) {
        [self addSubview:view];
        [view ABI47_0_0React_remountAllSubviews];
      }
    }
  } else {
    // If _removeClippedSubviews is false, we must already be showing all subviews
    [super ABI47_0_0React_remountAllSubviews];
  }
}

- (void)ABI47_0_0React_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // TODO (#5906496): for scrollviews (the primary use-case) we could
  // optimize this by only doing a range check along the scroll axis,
  // instead of comparing the whole frame

  if (!_removeClippedSubviews) {
    // Use default behavior if unmounting is disabled
    return [super ABI47_0_0React_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }

  if (self.ABI47_0_0ReactSubviews.count == 0) {
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
  for (UIView *view in self.ABI47_0_0ReactSubviews) {
    if (!CGSizeEqualToSize(CGRectIntersection(clipRect, view.frame).size, CGSizeZero)) {
      // View is at least partially visible, so remount it if unmounted
      [self addSubview:view];

      // Then test its subviews
      if (CGRectContainsRect(clipRect, view.frame)) {
        // View is fully visible, so remount all subviews
        [view ABI47_0_0React_remountAllSubviews];
      } else {
        // View is partially visible, so update clipped subviews
        [view ABI47_0_0React_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
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
    [self ABI47_0_0React_remountAllSubviews];
  }
  _removeClippedSubviews = removeClippedSubviews;
}

- (void)didUpdateABI47_0_0ReactSubviews
{
  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  } else {
    [super didUpdateABI47_0_0ReactSubviews];
  }
}

- (void)updateClippedSubviews
{
  // Find a suitable view to use for clipping
  UIView *clipView = [self ABI47_0_0React_findClipView];
  if (clipView) {
    [self ABI47_0_0React_updateClippedSubviewsWithClipRect:clipView.bounds relativeToView:clipView];
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

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    if ([self.traitCollection hasDifferentColorAppearanceComparedToTraitCollection:previousTraitCollection]) {
      [self.layer setNeedsDisplay];
    }
  }
#endif
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

static CGFloat ABI47_0_0RCTDefaultIfNegativeTo(CGFloat defaultValue, CGFloat x)
{
  return x >= 0 ? x : defaultValue;
};

- (UIEdgeInsets)bordersAsInsets
{
  const CGFloat borderWidth = MAX(0, _borderWidth);
  const BOOL isRTL = _ABI47_0_0ReactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[ABI47_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat borderStartWidth = ABI47_0_0RCTDefaultIfNegativeTo(_borderLeftWidth, _borderStartWidth);
    const CGFloat borderEndWidth = ABI47_0_0RCTDefaultIfNegativeTo(_borderRightWidth, _borderEndWidth);

    const CGFloat directionAwareBorderLeftWidth = isRTL ? borderEndWidth : borderStartWidth;
    const CGFloat directionAwareBorderRightWidth = isRTL ? borderStartWidth : borderEndWidth;

    return (UIEdgeInsets){
        ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
        ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderLeftWidth),
        ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
        ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderRightWidth),
    };
  }

  const CGFloat directionAwareBorderLeftWidth = isRTL ? _borderEndWidth : _borderStartWidth;
  const CGFloat directionAwareBorderRightWidth = isRTL ? _borderStartWidth : _borderEndWidth;

  return (UIEdgeInsets){
      ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
      ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, ABI47_0_0RCTDefaultIfNegativeTo(_borderLeftWidth, directionAwareBorderLeftWidth)),
      ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
      ABI47_0_0RCTDefaultIfNegativeTo(borderWidth, ABI47_0_0RCTDefaultIfNegativeTo(_borderRightWidth, directionAwareBorderRightWidth)),
  };
}

- (ABI47_0_0RCTCornerRadii)cornerRadii
{
  const BOOL isRTL = _ABI47_0_0ReactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  const CGFloat radius = MAX(0, _borderRadius);

  CGFloat topLeftRadius;
  CGFloat topRightRadius;
  CGFloat bottomLeftRadius;
  CGFloat bottomRightRadius;

  if ([[ABI47_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat topStartRadius = ABI47_0_0RCTDefaultIfNegativeTo(_borderTopLeftRadius, _borderTopStartRadius);
    const CGFloat topEndRadius = ABI47_0_0RCTDefaultIfNegativeTo(_borderTopRightRadius, _borderTopEndRadius);
    const CGFloat bottomStartRadius = ABI47_0_0RCTDefaultIfNegativeTo(_borderBottomLeftRadius, _borderBottomStartRadius);
    const CGFloat bottomEndRadius = ABI47_0_0RCTDefaultIfNegativeTo(_borderBottomRightRadius, _borderBottomEndRadius);

    const CGFloat directionAwareTopLeftRadius = isRTL ? topEndRadius : topStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? topStartRadius : topEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? bottomEndRadius : bottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? bottomStartRadius : bottomEndRadius;

    topLeftRadius = ABI47_0_0RCTDefaultIfNegativeTo(radius, directionAwareTopLeftRadius);
    topRightRadius = ABI47_0_0RCTDefaultIfNegativeTo(radius, directionAwareTopRightRadius);
    bottomLeftRadius = ABI47_0_0RCTDefaultIfNegativeTo(radius, directionAwareBottomLeftRadius);
    bottomRightRadius = ABI47_0_0RCTDefaultIfNegativeTo(radius, directionAwareBottomRightRadius);
  } else {
    const CGFloat directionAwareTopLeftRadius = isRTL ? _borderTopEndRadius : _borderTopStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? _borderTopStartRadius : _borderTopEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? _borderBottomEndRadius : _borderBottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? _borderBottomStartRadius : _borderBottomEndRadius;

    topLeftRadius =
        ABI47_0_0RCTDefaultIfNegativeTo(radius, ABI47_0_0RCTDefaultIfNegativeTo(_borderTopLeftRadius, directionAwareTopLeftRadius));
    topRightRadius =
        ABI47_0_0RCTDefaultIfNegativeTo(radius, ABI47_0_0RCTDefaultIfNegativeTo(_borderTopRightRadius, directionAwareTopRightRadius));
    bottomLeftRadius =
        ABI47_0_0RCTDefaultIfNegativeTo(radius, ABI47_0_0RCTDefaultIfNegativeTo(_borderBottomLeftRadius, directionAwareBottomLeftRadius));
    bottomRightRadius = ABI47_0_0RCTDefaultIfNegativeTo(
        radius, ABI47_0_0RCTDefaultIfNegativeTo(_borderBottomRightRadius, directionAwareBottomRightRadius));
  }

  // Get scale factors required to prevent radii from overlapping
  const CGSize size = self.bounds.size;
  const CGFloat topScaleFactor = ABI47_0_0RCTZeroIfNaN(MIN(1, size.width / (topLeftRadius + topRightRadius)));
  const CGFloat bottomScaleFactor = ABI47_0_0RCTZeroIfNaN(MIN(1, size.width / (bottomLeftRadius + bottomRightRadius)));
  const CGFloat rightScaleFactor = ABI47_0_0RCTZeroIfNaN(MIN(1, size.height / (topRightRadius + bottomRightRadius)));
  const CGFloat leftScaleFactor = ABI47_0_0RCTZeroIfNaN(MIN(1, size.height / (topLeftRadius + bottomLeftRadius)));

  // Return scaled radii
  return (ABI47_0_0RCTCornerRadii){
      topLeftRadius * MIN(topScaleFactor, leftScaleFactor),
      topRightRadius * MIN(topScaleFactor, rightScaleFactor),
      bottomLeftRadius * MIN(bottomScaleFactor, leftScaleFactor),
      bottomRightRadius * MIN(bottomScaleFactor, rightScaleFactor),
  };
}

- (ABI47_0_0RCTBorderColors)borderColorsWithTraitCollection:(UITraitCollection *)traitCollection
{
  const BOOL isRTL = _ABI47_0_0ReactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  UIColor *directionAwareBorderLeftColor = nil;
  UIColor *directionAwareBorderRightColor = nil;

  if ([[ABI47_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    UIColor *borderStartColor = _borderStartColor ?: _borderLeftColor;
    UIColor *borderEndColor = _borderEndColor ?: _borderRightColor;

    directionAwareBorderLeftColor = isRTL ? borderEndColor : borderStartColor;
    directionAwareBorderRightColor = isRTL ? borderStartColor : borderEndColor;
  } else {
    directionAwareBorderLeftColor = (isRTL ? _borderEndColor : _borderStartColor) ?: _borderLeftColor;
    directionAwareBorderRightColor = (isRTL ? _borderStartColor : _borderEndColor) ?: _borderRightColor;
  }

  UIColor *borderColor = _borderColor;
  UIColor *borderTopColor = _borderTopColor;
  UIColor *borderBottomColor = _borderBottomColor;

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    borderColor = [borderColor resolvedColorWithTraitCollection:self.traitCollection];
    borderTopColor = [borderTopColor resolvedColorWithTraitCollection:self.traitCollection];
    directionAwareBorderLeftColor =
        [directionAwareBorderLeftColor resolvedColorWithTraitCollection:self.traitCollection];
    borderBottomColor = [borderBottomColor resolvedColorWithTraitCollection:self.traitCollection];
    directionAwareBorderRightColor =
        [directionAwareBorderRightColor resolvedColorWithTraitCollection:self.traitCollection];
  }
#endif

  return (ABI47_0_0RCTBorderColors){
      (borderTopColor ?: borderColor).CGColor,
      (directionAwareBorderLeftColor ?: borderColor).CGColor,
      (borderBottomColor ?: borderColor).CGColor,
      (directionAwareBorderRightColor ?: borderColor).CGColor,
  };
}

- (void)ABI47_0_0ReactSetFrame:(CGRect)frame
{
  // If frame is zero, or below the threshold where the border radii can
  // be rendered as a stretchable image, we'll need to re-render.
  // TODO: detect up-front if re-rendering is necessary
  CGSize oldSize = self.bounds.size;
  [super ABI47_0_0ReactSetFrame:frame];
  if (!CGSizeEqualToSize(self.bounds.size, oldSize)) {
    [self.layer setNeedsDisplay];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  ABI47_0_0RCTUpdateShadowPathForView(self);

  const ABI47_0_0RCTCornerRadii cornerRadii = [self cornerRadii];
  const UIEdgeInsets borderInsets = [self bordersAsInsets];
  const ABI47_0_0RCTBorderColors borderColors = [self borderColorsWithTraitCollection:self.traitCollection];

  BOOL useIOSBorderRendering = ABI47_0_0RCTCornerRadiiAreEqual(cornerRadii) && ABI47_0_0RCTBorderInsetsAreEqual(borderInsets) &&
      ABI47_0_0RCTBorderColorsAreEqual(borderColors) && _borderStyle == ABI47_0_0RCTBorderStyleSolid &&

      // iOS draws borders in front of the content whereas CSS draws them behind
      // the content. For this reason, only use iOS border drawing when clipping
      // or when the border is hidden.

      (borderInsets.top == 0 || (borderColors.top && CGColorGetAlpha(borderColors.top) == 0) || self.clipsToBounds);

  // iOS clips to the outside of the border, but CSS clips to the inside. To
  // solve this, we'll need to add a container view inside the main view to
  // correctly clip the subviews.

  CGColorRef backgroundColor;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  if (@available(iOS 13.0, *)) {
    backgroundColor = [_backgroundColor resolvedColorWithTraitCollection:self.traitCollection].CGColor;
  } else {
    backgroundColor = _backgroundColor.CGColor;
  }
#else
  backgroundColor = _backgroundColor.CGColor;
#endif

  if (useIOSBorderRendering) {
    layer.cornerRadius = cornerRadii.topLeft;
    layer.borderColor = borderColors.left;
    layer.borderWidth = borderInsets.left;
    layer.backgroundColor = backgroundColor;
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    layer.mask = nil;
    return;
  }

  UIImage *image = ABI47_0_0RCTGetBorderImage(
      _borderStyle, layer.bounds.size, cornerRadii, borderInsets, borderColors, backgroundColor, self.clipsToBounds);

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
        insets.left / size.width, insets.top / size.height, (CGFloat)1.0 / size.width, (CGFloat)1.0 / size.height);
  });

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

static BOOL ABI47_0_0RCTLayerHasShadow(CALayer *layer)
{
  return layer.shadowOpacity * CGColorGetAlpha(layer.shadowColor) > 0;
}

static void ABI47_0_0RCTUpdateShadowPathForView(ABI47_0_0RCTView *view)
{
  if (ABI47_0_0RCTLayerHasShadow(view.layer)) {
    if (CGColorGetAlpha(view.backgroundColor.CGColor) > 0.999) {
      // If view has a solid background color, calculate shadow path from border
      const ABI47_0_0RCTCornerRadii cornerRadii = [view cornerRadii];
      const ABI47_0_0RCTCornerInsets cornerInsets = ABI47_0_0RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero);
      CGPathRef shadowPath = ABI47_0_0RCTPathCreateWithRoundedRect(view.bounds, cornerInsets, NULL);
      view.layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);

    } else {
      // Can't accurately calculate box shadow, so fall back to pixel-based shadow
      view.layer.shadowPath = nil;

      ABI47_0_0RCTLogAdvice(
          @"View #%@ of type %@ has a shadow set but cannot calculate "
           "shadow efficiently. Consider setting a background color to "
           "fix this, or apply the shadow to a more specific component.",
          view.ABI47_0_0ReactTag,
          [view class]);
    }
  }
}

- (void)updateClippingForLayer:(CALayer *)layer
{
  CALayer *mask = nil;
  CGFloat cornerRadius = 0;

  if (self.clipsToBounds) {
    const ABI47_0_0RCTCornerRadii cornerRadii = [self cornerRadii];
    if (ABI47_0_0RCTCornerRadiiAreEqual(cornerRadii)) {
      cornerRadius = cornerRadii.topLeft;

    } else {
      CAShapeLayer *shapeLayer = [CAShapeLayer layer];
      CGPathRef path =
          ABI47_0_0RCTPathCreateWithRoundedRect(self.bounds, ABI47_0_0RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL);
      shapeLayer.path = path;
      CGPathRelease(path);
      mask = shapeLayer;
    }
  }

  layer.cornerRadius = cornerRadius;
  layer.mask = mask;
}

#pragma mark Border Color

#define setBorderColor(side)                       \
  -(void)setBorder##side##Color : (UIColor *)color \
  {                                                \
    if ([_border##side##Color isEqual:color]) {    \
      return;                                      \
    }                                              \
    _border##side##Color = color;                  \
    [self.layer setNeedsDisplay];                  \
  }

setBorderColor() setBorderColor(Top) setBorderColor(Right) setBorderColor(Bottom) setBorderColor(Left)
    setBorderColor(Start) setBorderColor(End)

#pragma mark - Border Width

#define setBorderWidth(side)                     \
  -(void)setBorder##side##Width : (CGFloat)width \
  {                                              \
    if (_border##side##Width == width) {         \
      return;                                    \
    }                                            \
    _border##side##Width = width;                \
    [self.layer setNeedsDisplay];                \
  }

        setBorderWidth() setBorderWidth(Top) setBorderWidth(Right) setBorderWidth(Bottom) setBorderWidth(Left)
            setBorderWidth(Start) setBorderWidth(End)

#pragma mark - Border Radius

#define setBorderRadius(side)                      \
  -(void)setBorder##side##Radius : (CGFloat)radius \
  {                                                \
    if (_border##side##Radius == radius) {         \
      return;                                      \
    }                                              \
    _border##side##Radius = radius;                \
    [self.layer setNeedsDisplay];                  \
  }

                setBorderRadius() setBorderRadius(TopLeft) setBorderRadius(TopRight) setBorderRadius(TopStart)
                    setBorderRadius(TopEnd) setBorderRadius(BottomLeft) setBorderRadius(BottomRight)
                        setBorderRadius(BottomStart) setBorderRadius(BottomEnd)

#pragma mark - Border Style

#define setBorderStyle(side)                            \
  -(void)setBorder##side##Style : (ABI47_0_0RCTBorderStyle)style \
  {                                                     \
    if (_border##side##Style == style) {                \
      return;                                           \
    }                                                   \
    _border##side##Style = style;                       \
    [self.layer setNeedsDisplay];                       \
  }

                            setBorderStyle()

                                @end
