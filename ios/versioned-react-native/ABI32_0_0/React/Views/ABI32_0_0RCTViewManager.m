/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTViewManager.h"

#import "ABI32_0_0RCTBorderStyle.h"
#import "ABI32_0_0RCTBridge.h"
#import "ABI32_0_0RCTConvert.h"
#import "ABI32_0_0RCTEventDispatcher.h"
#import "ABI32_0_0RCTLog.h"
#import "ABI32_0_0RCTShadowView.h"
#import "ABI32_0_0RCTUIManager.h"
#import "ABI32_0_0RCTUIManagerUtils.h"
#import "ABI32_0_0RCTUtils.h"
#import "ABI32_0_0RCTView.h"
#import "UIView+ReactABI32_0_0.h"
#import "ABI32_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI32_0_0RCTTVView.h"
#endif

@implementation ABI32_0_0RCTConvert(UIAccessibilityTraits)

ABI32_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI32_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI32_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI32_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI32_0_0RCTTVView new];
#else
  return [ABI32_0_0RCTView new];
#endif
}

- (ABI32_0_0RCTShadowView *)shadowView
{
  return [ABI32_0_0RCTShadowView new];
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
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI32_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI32_0_0AccessibilityElement.accessibilityActions, NSString)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI32_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ReactABI32_0_0AccessibilityElement.accessibilityHint, NSString)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI32_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI32_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI32_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ReactABI32_0_0AccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI32_0_0AccessibilityElement.onAccessibilityAction, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI32_0_0AccessibilityElement.onAccessibilityTap, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI32_0_0AccessibilityElement.onMagicTap, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI32_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI32_0_0YGOverflow, ABI32_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI32_0_0RCTConvert ABI32_0_0YGOverflow:json] != ABI32_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI32_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI32_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI32_0_0RCTView)
{
  view.layer.transform = json ? [ABI32_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI32_0_0RCTView)
{
    view.ReactABI32_0_0AccessibilityElement.accessibilityTraits |= json ? [ABI32_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityStates, UIAccessibilityTraits, ABI32_0_0RCTView)
{
    view.ReactABI32_0_0AccessibilityElement.accessibilityTraits |= json ? [ABI32_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI32_0_0RCTPointerEvents, ABI32_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI32_0_0RCTConvert ABI32_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI32_0_0RCTConvert ABI32_0_0RCTPointerEvents:json]) {
    case ABI32_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI32_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI32_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI32_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI32_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI32_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI32_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI32_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI32_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI32_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI32_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI32_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI32_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI32_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI32_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI32_0_0RCTBorderStyle, ABI32_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI32_0_0RCTConvert ABI32_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI32_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI32_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI32_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI32_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI32_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI32_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI32_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI32_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI32_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI32_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI32_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI32_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI32_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI32_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI32_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI32_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI32_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI32_0_0Display, ABI32_0_0YGDisplay)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI32_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI32_0_0YGValue)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI32_0_0YGValue)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI32_0_0YGValue)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI32_0_0YGValue)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI32_0_0YGValue)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI32_0_0YGValue)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI32_0_0YGFlexDirection)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI32_0_0YGWrap)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI32_0_0YGJustify)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI32_0_0YGAlign)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI32_0_0YGAlign)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI32_0_0YGAlign)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI32_0_0YGPositionType)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI32_0_0YGOverflow)
ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI32_0_0YGDisplay)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI32_0_0RCTDirectEventBlock)

ABI32_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI32_0_0YGDirection)

@end
