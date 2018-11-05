/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTViewManager.h"

#import "ABI28_0_0RCTBorderStyle.h"
#import "ABI28_0_0RCTBridge.h"
#import "ABI28_0_0RCTConvert.h"
#import "ABI28_0_0RCTEventDispatcher.h"
#import "ABI28_0_0RCTLog.h"
#import "ABI28_0_0RCTShadowView.h"
#import "ABI28_0_0RCTUIManager.h"
#import "ABI28_0_0RCTUIManagerUtils.h"
#import "ABI28_0_0RCTUtils.h"
#import "ABI28_0_0RCTView.h"
#import "UIView+ReactABI28_0_0.h"
#import "ABI28_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI28_0_0RCTTVView.h"
#endif

@implementation ABI28_0_0RCTConvert(UIAccessibilityTraits)

ABI28_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
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

@implementation ABI28_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI28_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI28_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI28_0_0RCTTVView new];
#else
  return [ABI28_0_0RCTView new];
#endif
}

- (ABI28_0_0RCTShadowView *)shadowView
{
  return [ABI28_0_0RCTShadowView new];
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
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI28_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI28_0_0AccessibilityElement.accessibilityActions, NSString)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI28_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI28_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI28_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI28_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI28_0_0AccessibilityElement.onAccessibilityAction, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI28_0_0AccessibilityElement.onAccessibilityTap, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI28_0_0AccessibilityElement.onMagicTap, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI28_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI28_0_0YGOverflow, ABI28_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI28_0_0RCTConvert ABI28_0_0YGOverflow:json] != ABI28_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI28_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI28_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI28_0_0RCTView)
{
  view.layer.transform = json ? [ABI28_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI28_0_0RCTPointerEvents, ABI28_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI28_0_0RCTConvert ABI28_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI28_0_0RCTConvert ABI28_0_0RCTPointerEvents:json]) {
    case ABI28_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI28_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI28_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI28_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI28_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI28_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI28_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI28_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI28_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI28_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI28_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI28_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI28_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI28_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI28_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI28_0_0RCTBorderStyle, ABI28_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI28_0_0RCTConvert ABI28_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI28_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI28_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI28_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI28_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI28_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI28_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI28_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI28_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI28_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI28_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI28_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI28_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI28_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI28_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI28_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI28_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI28_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI28_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI28_0_0Display, ABI28_0_0YGDisplay)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI28_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI28_0_0YGValue)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI28_0_0YGValue)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI28_0_0YGValue)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI28_0_0YGValue)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI28_0_0YGValue)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI28_0_0YGValue)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI28_0_0YGFlexDirection)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI28_0_0YGWrap)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI28_0_0YGJustify)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI28_0_0YGAlign)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI28_0_0YGAlign)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI28_0_0YGAlign)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI28_0_0YGPositionType)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI28_0_0YGOverflow)
ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI28_0_0YGDisplay)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI28_0_0RCTDirectEventBlock)

ABI28_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI28_0_0YGDirection)

@end
