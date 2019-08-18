/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTViewManager.h"

#import "ABI31_0_0RCTBorderStyle.h"
#import "ABI31_0_0RCTBridge.h"
#import "ABI31_0_0RCTConvert.h"
#import "ABI31_0_0RCTEventDispatcher.h"
#import "ABI31_0_0RCTLog.h"
#import "ABI31_0_0RCTShadowView.h"
#import "ABI31_0_0RCTUIManager.h"
#import "ABI31_0_0RCTUIManagerUtils.h"
#import "ABI31_0_0RCTUtils.h"
#import "ABI31_0_0RCTView.h"
#import "UIView+ReactABI31_0_0.h"
#import "ABI31_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI31_0_0RCTTVView.h"
#endif

@implementation ABI31_0_0RCTConvert(UIAccessibilityTraits)

ABI31_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"imagebutton": @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"keyboardkey": @(UIAccessibilityTraitKeyboardKey),
  @"text": @(UIAccessibilityTraitStaticText),
  @"summary": @(UIAccessibilityTraitSummaryElement),
  @"disabled": @(UIAccessibilityTraitNotEnabled),
  @"frequentUpdates": @(UIAccessibilityTraitUpdatesFrequently),
  @"startsMedia": @(UIAccessibilityTraitStartsMediaSession),
  @"adjustable": @(UIAccessibilityTraitAdjustable),
  @"allowsDirectInteraction": @(UIAccessibilityTraitAllowsDirectInteraction),
  @"pageTurn": @(UIAccessibilityTraitCausesPageTurn),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation ABI31_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI31_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI31_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI31_0_0RCTTVView new];
#else
  return [ABI31_0_0RCTView new];
#endif
}

- (ABI31_0_0RCTShadowView *)shadowView
{
  return [ABI31_0_0RCTShadowView new];
}

- (NSArray<NSString *> *)customBubblingEventTypes
{
  return @[

    // Generic events
    @"press",
    @"change",
    @"focus",
    @"blur",
    @"submitEditing",
    @"endEditing",
    @"keyPress",

    // Touch events
    @"touchStart",
    @"touchMove",
    @"touchCancel",
    @"touchEnd",
  ];
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI31_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI31_0_0AccessibilityElement.accessibilityActions, NSString)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI31_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ReactABI31_0_0AccessibilityElement.accessibilityHint, NSString)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI31_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI31_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI31_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ReactABI31_0_0AccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI31_0_0AccessibilityElement.onAccessibilityAction, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI31_0_0AccessibilityElement.onAccessibilityTap, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI31_0_0AccessibilityElement.onMagicTap, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI31_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI31_0_0YGOverflow, ABI31_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI31_0_0RCTConvert ABI31_0_0YGOverflow:json] != ABI31_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI31_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI31_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI31_0_0RCTView)
{
  view.layer.transform = json ? [ABI31_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI31_0_0RCTView)
{
    view.ReactABI31_0_0AccessibilityElement.accessibilityTraits |= json ? [ABI31_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityStates, UIAccessibilityTraits, ABI31_0_0RCTView)
{
    view.ReactABI31_0_0AccessibilityElement.accessibilityTraits |= json ? [ABI31_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI31_0_0RCTPointerEvents, ABI31_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI31_0_0RCTConvert ABI31_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI31_0_0RCTConvert ABI31_0_0RCTPointerEvents:json]) {
    case ABI31_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI31_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI31_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI31_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI31_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI31_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI31_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI31_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI31_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI31_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI31_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI31_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI31_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI31_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI31_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI31_0_0RCTBorderStyle, ABI31_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI31_0_0RCTConvert ABI31_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI31_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI31_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI31_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI31_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI31_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI31_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI31_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI31_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI31_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI31_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI31_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI31_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI31_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI31_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI31_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI31_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI31_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI31_0_0Display, ABI31_0_0YGDisplay)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI31_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI31_0_0YGValue)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI31_0_0YGValue)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI31_0_0YGValue)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI31_0_0YGValue)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI31_0_0YGValue)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI31_0_0YGValue)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI31_0_0YGFlexDirection)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI31_0_0YGWrap)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI31_0_0YGJustify)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI31_0_0YGAlign)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI31_0_0YGAlign)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI31_0_0YGAlign)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI31_0_0YGPositionType)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI31_0_0YGOverflow)
ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI31_0_0YGDisplay)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI31_0_0RCTDirectEventBlock)

ABI31_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI31_0_0YGDirection)

@end
